import type { UserRoleType } from '../../types/domain';
import type { PendingProfileDraft } from '../../components/AuthGatePanel';

export type AuthModalMode = 'login' | 'register';

export interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  role: UserRoleType;
}

export interface AuthActionFeedback {
  type: 'success' | 'error';
  text: string;
}

export type { PendingProfileDraft, UserRoleType };
