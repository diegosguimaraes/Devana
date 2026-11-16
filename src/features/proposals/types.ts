import type { AppBid, AppChatMessage, AppProject } from '../../types/domain';

export type DetailPanelTab = 'proposals' | 'chat';

export interface SubmitBidPayload {
  amount: number;
  deliveryDays: number;
  pitch: string;
}

export type { AppBid, AppChatMessage, AppProject };
