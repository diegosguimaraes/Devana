import React from 'react';
import { Modal } from '../../../components/ui';
import { AuthGatePanel } from '../../../components/AuthGatePanel';
import type { UserRoleType } from '../../../types/domain';
import type { AuthModalMode } from '../types';

export interface AuthModalProps {
  open: boolean;
  mode: AuthModalMode;
  role: UserRoleType;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  mode,
  role,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <AuthGatePanel initialMode={mode} initialRole={role} onSuccess={onSuccess} />
    </Modal>
  );
};
