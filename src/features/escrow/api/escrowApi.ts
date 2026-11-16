import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import { apiClient } from '../../../lib';
import { buildEscrowIdempotencyKey } from '../../../hooks/useEscrow';
import type { ActiveUserProfileData, AppBid, AppProject } from '../../../types/domain';
import type { SubmitReviewPayload } from '../types';

export async function fundEscrowBatch(
  project: AppProject,
  bid: AppBid,
  projectBids: AppBid[]
): Promise<string> {
  const idempotencyKey = buildEscrowIdempotencyKey('in_escrow', project.id, bid.id);
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'projects', project.id), {
      assignedFreelancerId: bid.freelancerId,
      assignedFreelancerName: bid.freelancerName,
      budget: bid.amount,
      status: 'in_progress',
      escrowStatus: 'funded',
      updatedAt: serverTimestamp(),
    });

    for (const b of projectBids) {
      if (b.status === 'pending') {
        batch.update(doc(db, 'projects', project.id, 'bids', b.id), {
          status: b.id === bid.id ? 'accepted' : 'rejected',
          updatedAt: serverTimestamp(),
        });
      }
    }

    batch.set(doc(db, 'projects', project.id, 'escrow_ledger', idempotencyKey), {
      projectId: project.id,
      projectOwnerId: project.ownerId,
      freelancerId: bid.freelancerId,
      actorUid: project.ownerId,
      state: 'in_escrow',
      amount: bid.amount,
      commissionAmount: 0,
      idempotencyKey,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    return idempotencyKey;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
  }
}

export async function releaseEscrowPayment(project: AppProject): Promise<string> {
  const idempotencyKey = buildEscrowIdempotencyKey('released', project.id, 'release');
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'projects', project.id), {
      status: 'completed',
      escrowStatus: 'released',
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'projects', project.id, 'escrow_ledger', idempotencyKey), {
      projectId: project.id,
      projectOwnerId: project.ownerId,
      freelancerId: project.assignedFreelancerId || project.ownerId,
      actorUid: project.ownerId,
      state: 'released',
      amount: project.budget,
      commissionAmount: 0,
      idempotencyKey,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return idempotencyKey;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
  }
}

export async function fetchEscrowLedgerHistory(projectId: string) {
  return apiClient.get<{
    projectId: string;
    entries: Array<{
      entryId: string;
      state: 'pending' | 'in_escrow' | 'released' | 'refunded';
      amount: number;
      commissionAmount: number;
      idempotencyKey: string;
      createdAtIso: string;
      integrityHash: string;
    }>;
  }>(`/api/escrow/ledger/${encodeURIComponent(projectId)}`, { auth: true });
}

export async function submitProjectReviewDocument(
  project: AppProject,
  currentUser: ActiveUserProfileData,
  payload: SubmitReviewPayload
): Promise<string> {
  const revId = `rev_${Date.now()}`;
  const targetId =
    currentUser.uid === project.ownerId
      ? project.assignedFreelancerId || project.ownerId
      : project.ownerId;

  try {
    await setDoc(doc(db, 'projects', project.id, 'reviews', revId), {
      projectId: project.id,
      projectOwnerId: project.ownerId,
      reviewerId: currentUser.uid,
      reviewerName: currentUser.displayName.slice(0, 80),
      targetUserId: targetId,
      rating: payload.rating,
      codeQualityScore: payload.codeQualityScore,
      communicationScore: payload.communicationScore,
      comment: payload.comment.slice(0, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `projects/${project.id}/reviews/${revId}`
    );
  }
  return revId;
}
