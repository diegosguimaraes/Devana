import { useState } from 'react';
import { validateBidInput } from '../../../lib';
import type { ActiveUserProfileData, AppProject } from '../../../types/domain';
import type { SubmitBidPayload } from '../types';

export function useProposalForm({
  selectedProject,
  currentUser,
  requireVerifiedAuth,
  onSubmitBid,
  onFeedback,
  onSuccessNotify,
  onErrorToast,
}: {
  selectedProject: AppProject | null;
  currentUser: ActiveUserProfileData | null;
  requireVerifiedAuth: () => boolean;
  onSubmitBid: (
    project: AppProject,
    user: ActiveUserProfileData,
    payload: SubmitBidPayload
  ) => Promise<string>;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
  onSuccessNotify: (projectTitle: string, amount: number) => void;
  onErrorToast: () => void;
}) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidDays, setBidDays] = useState<string>('');
  const [bidPitch, setBidPitch] = useState<string>('');
  const [bidSubmitting, setBidSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || bidSubmitting) return;
    if (!requireVerifiedAuth() || !currentUser) return;

    if (selectedProject.ownerId === currentUser.uid) {
      onFeedback({
        type: 'error',
        text: 'Você não pode enviar uma proposta no seu próprio projeto.',
      });
      return;
    }

    const validation = validateBidInput({
      amount: bidAmount,
      deliveryDays: bidDays,
      pitch: bidPitch,
    });

    if (validation.ok === false) {
      onFeedback({ type: 'error', text: validation.error });
      return;
    }

    setBidSubmitting(true);
    try {
      await onSubmitBid(selectedProject, currentUser, validation.data);
      setBidPitch('');
      setBidAmount('');
      setBidDays('');
      onSuccessNotify(selectedProject.title, validation.data.amount);
    } catch {
      onErrorToast();
    } finally {
      setBidSubmitting(false);
    }
  };

  return {
    bidAmount,
    setBidAmount,
    bidDays,
    setBidDays,
    bidPitch,
    setBidPitch,
    bidSubmitting,
    handleSubmit,
  };
}
