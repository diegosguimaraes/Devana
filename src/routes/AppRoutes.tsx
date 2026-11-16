import React, { Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ShellSection } from '../components/layout/AppShell';
import type { MarketplaceRouteViewProps } from './MarketplaceRouteView';
import type { UserPanelRouteViewProps } from './UserPanelRouteView';
import type { EscrowViewProps } from '../features/escrow/components/EscrowView';
import type { WorkspaceViewProps } from '../features/chat/components/WorkspaceView';
import type { ReportsViewProps } from '../features/reports/components/ReportsView';
import type { SecurityCenterViewProps } from '../features/security/components/SecurityCenterView';
import type {
  ActiveUserProfileData,
  AppReview,
  SpecialistProfile,
  UserRoleType,
} from '../types/domain';
import type { CreateProjectPayload } from '../features/projects/types';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RouteFallback } from './RouteFallback';

export const LazyLandingPage = lazy(() =>
  import('../components/LandingPage').then((m) => ({ default: m.LandingPage }))
);

export const LazyAppShell = lazy(() =>
  import('../components/layout/AppShell').then((m) => ({ default: m.AppShell }))
);

const LazyMarketplaceRouteView = lazy(() => import('./MarketplaceRouteView'));
const LazyUserPanelRouteView = lazy(() => import('./UserPanelRouteView'));

const LazyWorkspaceView = lazy(() =>
  import('../features/chat/components/WorkspaceView').then((m) => ({
    default: m.WorkspaceView,
  }))
);

const LazyEscrowView = lazy(() =>
  import('../features/escrow/components/EscrowView').then((m) => ({
    default: m.EscrowView,
  }))
);

const LazyReportsView = lazy(() =>
  import('../features/reports/components/ReportsView').then((m) => ({
    default: m.ReportsView,
  }))
);

const LazySecurityCenterView = lazy(() =>
  import('../features/security/components/SecurityCenterView').then((m) => ({
    default: m.SecurityCenterView,
  }))
);

const LazyNewProjectModal = lazy(() =>
  import('../features/projects/components/NewProjectModal').then((m) => ({
    default: m.NewProjectModal,
  }))
);

const LazyAuthModal = lazy(() =>
  import('../features/auth/components/AuthModal').then((m) => ({
    default: m.AuthModal,
  }))
);

const LazyFreelancerProfileModal = lazy(() =>
  import('../components/FreelancerProfileModal').then((m) => ({
    default: m.FreelancerProfileModal,
  }))
);

export interface AppSectionRoutesProps {
  activeSection: ShellSection;
  marketplaceProps: MarketplaceRouteViewProps;
  workspaceProps: WorkspaceViewProps;
  escrowProps: EscrowViewProps;
  reportsProps: ReportsViewProps;
  securityProps: SecurityCenterViewProps;
  userPanelProps: UserPanelRouteViewProps;
}

export const AppSectionRoutes: React.FC<AppSectionRoutesProps> = ({
  activeSection,
  marketplaceProps,
  workspaceProps,
  escrowProps,
  reportsProps,
  securityProps,
  userPanelProps,
}) => {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback section={activeSection} />}>
        <AnimatePresence mode="wait">
          {activeSection === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <LazyMarketplaceRouteView {...marketplaceProps} />
            </motion.div>
          )}

          {activeSection === 'workspace' && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <LazyWorkspaceView {...workspaceProps} />
            </motion.div>
          )}

          {activeSection === 'escrow' && (
            <motion.div
              key="escrow"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <LazyEscrowView {...escrowProps} />
            </motion.div>
          )}

          {activeSection === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <LazyReportsView {...reportsProps} />
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <LazySecurityCenterView {...securityProps} />
            </motion.div>
          )}

          {activeSection === 'user_panel' && (
            <motion.div
              key="user_panel"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <LazyUserPanelRouteView {...userPanelProps} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </RouteErrorBoundary>
  );
};

export interface AppModalsProps {
  isNewProjectModalOpen: boolean;
  onCloseNewProjectModal: () => void;
  currentUser: ActiveUserProfileData | null;
  onSubmitProject: (
    user: ActiveUserProfileData,
    payload: CreateProjectPayload
  ) => Promise<string>;
  onProjectCreated: (title: string, budget: number) => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authModalRole: UserRoleType;
  onCloseAuthModal: () => void;
  onAuthSuccess: (msg: string) => void;
  selectedSpecialistProfile: SpecialistProfile | null;
  allReviews: AppReview[];
  onCloseSpecialistProfile: () => void;
  onInviteSpecialist: () => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  isNewProjectModalOpen,
  onCloseNewProjectModal,
  currentUser,
  onSubmitProject,
  onProjectCreated,
  isAuthModalOpen,
  authModalMode,
  authModalRole,
  onCloseAuthModal,
  onAuthSuccess,
  selectedSpecialistProfile,
  allReviews,
  onCloseSpecialistProfile,
  onInviteSpecialist,
  onFeedback,
}) => (
  <Suspense fallback={null}>
    {isNewProjectModalOpen && (
      <LazyNewProjectModal
        open={isNewProjectModalOpen}
        currentUser={currentUser}
        onClose={onCloseNewProjectModal}
        onSubmitProject={onSubmitProject}
        onFeedback={onFeedback}
        onProjectCreated={onProjectCreated}
      />
    )}

    {isAuthModalOpen && (
      <LazyAuthModal
        open={isAuthModalOpen}
        mode={authModalMode}
        role={authModalRole}
        onClose={onCloseAuthModal}
        onSuccess={onAuthSuccess}
      />
    )}

    {selectedSpecialistProfile && (
      <LazyFreelancerProfileModal
        specialist={selectedSpecialistProfile}
        reviews={allReviews}
        onClose={onCloseSpecialistProfile}
        onInviteToProject={onInviteSpecialist}
      />
    )}
  </Suspense>
);
