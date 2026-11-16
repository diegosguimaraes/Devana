import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import type { ActiveUserProfileData, AppProject } from '../../../types/domain';
import type { SubmitBidPayload } from '../types';

export async function submitBidDocument(
  project: AppProject,
  currentUser: ActiveUserProfileData,
  payload: SubmitBidPayload
): Promise<string> {
  const bidId = `bid_${Date.now()}`;
  try {
    await setDoc(doc(db, 'projects', project.id, 'bids', bidId), {
      projectId: project.id,
      projectOwnerId: project.ownerId,
      freelancerId: currentUser.uid,
      freelancerName: currentUser.displayName.slice(0, 80),
      freelancerSpecialty: (currentUser.specialty || 'Especialista').slice(0, 100),
      amount: payload.amount,
      deliveryDays: payload.deliveryDays,
      pitch: payload.pitch,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `projects/${project.id}/bids/${bidId}`
    );
  }
  return bidId;
}
