import type { EscrowTimelineStep } from '../../hooks/useEscrow';
import type { AppProject, AppReview } from '../../types/domain';

export interface SubmitReviewPayload {
  rating: number;
  codeQualityScore: number;
  communicationScore: number;
  comment: string;
}

export type { AppProject, AppReview, EscrowTimelineStep };
