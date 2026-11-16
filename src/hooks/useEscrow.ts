import { useCallback } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { apiClient } from '../lib';
import type {
  ActiveUserProfileData,
  AppBid,
  AppProject,
  EscrowLedgerState,
} from '../types/domain';

export interface EscrowTimelineStep {
  key: 'unfunded' | 'funded' | 'released' | 'refunded';
  label: string;
  done: boolean;
}

function sanitizeKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'ref';
}

export function buildEscrowIdempotencyKey(
  state: EscrowLedgerState,
  projectId: string,
  qualifier = 'tx'
): string {
  const safeState = sanitizeKeyPart(state);
  const safeProj = sanitizeKeyPart(projectId);
  const safeQual = sanitizeKeyPart(qualifier);
  return `esc_${safeState}_${safeProj}_${safeQual}`.slice(0, 128);
}

async function mirrorEscrowLedgerAuditToServer(payload: {
  projectId: string;
  projectOwnerId: string;
  freelancerId: string;
  state: EscrowLedgerState;
  amount: number;
  idempotencyKey: string;
}): Promise<void> {
  try {
    await apiClient.post('/api/escrow/ledger', payload, {
      auth: true,
      headers: {
        'X-Idempotency-Key': payload.idempotencyKey,
      },
    });
  } catch {
    // Non-blocking audit sync: Firestore ledger entry already persisted atomically
  }
}

export function getEscrowTimelineSteps(
  escrowStatus: AppProject['escrowStatus']
): EscrowTimelineStep[] {
  if (escrowStatus === 'refunded') {
    return [
      { key: 'unfunded', label: 'Publicado', done: true },
      { key: 'funded', label: 'Garantia Ativa', done: true },
      { key: 'refunded', label: 'Reembolsado', done: true },
    ];
  }

  return [
    {
      key: 'unfunded',
      label: 'Publicado',
      done: true,
    },
    {
      key: 'funded',
      label: 'Garantia Ativa',
      done: escrowStatus === 'funded' || escrowStatus === 'released',
    },
    {
      key: 'released',
      label: '100% Liberado',
      done: escrowStatus === 'released',
    },
  ];
}

export function useEscrow() {
  const acceptBidAndFundEscrow = useCallback(
    async ({
      project,
      bid,
      currentUser,
      projectBids,
    }: {
      project: AppProject;
      bid: AppBid;
      currentUser: ActiveUserProfileData;
      projectBids: AppBid[];
    }): Promise<
      | { ok: true; amount: number; freelancerName: string; idempotencyKey: string }
      | { ok: false; error: string }
    > => {
      if (project.ownerId !== currentUser.uid) {
        return {
          ok: false,
          error:
            'Apenas o cliente proprietário deste projeto pode aceitar propostas e ativar a garantia.',
        };
      }

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
          actorUid: currentUser.uid,
          state: 'in_escrow',
          amount: bid.amount,
          commissionAmount: 0,
          idempotencyKey,
          createdAt: serverTimestamp(),
        });

        await batch.commit();

        void mirrorEscrowLedgerAuditToServer({
          projectId: project.id,
          projectOwnerId: project.ownerId,
          freelancerId: bid.freelancerId,
          state: 'in_escrow',
          amount: bid.amount,
          idempotencyKey,
        });

        return {
          ok: true,
          amount: bid.amount,
          freelancerName: bid.freelancerName,
          idempotencyKey,
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
      }
    },
    []
  );

  const completeAndReleaseEscrow = useCallback(
    async ({
      project,
      currentUser,
    }: {
      project: AppProject;
      currentUser: ActiveUserProfileData;
    }): Promise<
      | { ok: true; budget: number; freelancerName: string; idempotencyKey: string }
      | { ok: false; error: string }
    > => {
      if (project.ownerId !== currentUser.uid) {
        return {
          ok: false,
          error: 'Apenas o cliente contratante pode liberar o pagamento em garantia.',
        };
      }

      const idempotencyKey = buildEscrowIdempotencyKey('released', project.id, 'release');
      const freelancerId = project.assignedFreelancerId || project.ownerId;

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
          freelancerId,
          actorUid: currentUser.uid,
          state: 'released',
          amount: project.budget,
          commissionAmount: 0,
          idempotencyKey,
          createdAt: serverTimestamp(),
        });
        await batch.commit();

        void mirrorEscrowLedgerAuditToServer({
          projectId: project.id,
          projectOwnerId: project.ownerId,
          freelancerId,
          state: 'released',
          amount: project.budget,
          idempotencyKey,
        });

        return {
          ok: true,
          budget: project.budget,
          freelancerName: project.assignedFreelancerName || 'o especialista',
          idempotencyKey,
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
      }
    },
    []
  );

  const refundEscrowAndCancelProject = useCallback(
    async ({
      project,
      currentUser,
    }: {
      project: AppProject;
      currentUser: ActiveUserProfileData;
    }): Promise<
      { ok: true; budget: number; idempotencyKey: string } | { ok: false; error: string }
    > => {
      if (project.ownerId !== currentUser.uid) {
        return {
          ok: false,
          error:
            'Apenas o cliente contratante pode solicitar reembolso e encerrar o contrato em garantia.',
        };
      }

      if (project.status !== 'in_progress' || project.escrowStatus !== 'funded') {
        return {
          ok: false,
          error:
            'O reembolso só está disponível para projetos ativos com garantia retida.',
        };
      }

      const idempotencyKey = buildEscrowIdempotencyKey('refunded', project.id, 'refund');
      const freelancerId = project.assignedFreelancerId || project.ownerId;

      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'projects', project.id), {
          status: 'cancelled',
          escrowStatus: 'refunded',
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'projects', project.id, 'escrow_ledger', idempotencyKey), {
          projectId: project.id,
          projectOwnerId: project.ownerId,
          freelancerId,
          actorUid: currentUser.uid,
          state: 'refunded',
          amount: project.budget,
          commissionAmount: 0,
          idempotencyKey,
          createdAt: serverTimestamp(),
        });
        await batch.commit();

        void mirrorEscrowLedgerAuditToServer({
          projectId: project.id,
          projectOwnerId: project.ownerId,
          freelancerId,
          state: 'refunded',
          amount: project.budget,
          idempotencyKey,
        });

        return {
          ok: true,
          budget: project.budget,
          idempotencyKey,
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
      }
    },
    []
  );

  return {
    acceptBidAndFundEscrow,
    completeAndReleaseEscrow,
    refundEscrowAndCancelProject,
    getEscrowTimelineSteps,
  };
}
