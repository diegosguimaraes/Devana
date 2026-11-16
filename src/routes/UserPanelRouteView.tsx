import React from 'react';
import { AuthGatePanel } from '../components/AuthGatePanel';
import { UserDashboardPanel } from '../components/UserDashboardPanel';
import type { ShellSection } from '../components/layout/AppShell';
import type {
  ActiveUserProfileData,
  AppBid,
  AppProject,
  AppReview,
  AppWorklog,
  UserRoleType,
} from '../types/domain';

export interface UserPanelRouteViewProps {
  currentUser: ActiveUserProfileData | null;
  userEmail: string | null;
  projects: AppProject[];
  bidsByProject: Record<string, AppBid[]>;
  worklogsByProject: Record<string, AppWorklog[]>;
  reviews: AppReview[];
  requireVerifiedAuth: () => boolean;
  onSaveProfile: (updated: {
    displayName: string;
    roleType: UserRoleType;
    specialty: string;
    hourlyRate: number;
    githubUsername: string;
    bio: string;
    avatarUrl: string;
    isAvailableForHire: boolean;
  }) => Promise<void>;
  onResendVerificationEmail: () => Promise<void>;
  onRefreshVerificationStatus: () => Promise<void>;
  onOpenNewProjectModal: () => void;
  onSelectProject: (projectId: string) => void;
  onNavigateSection: (section: ShellSection) => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}

export const UserPanelRouteView: React.FC<UserPanelRouteViewProps> = ({
  currentUser,
  userEmail,
  projects,
  bidsByProject,
  worklogsByProject,
  reviews,
  requireVerifiedAuth,
  onSaveProfile,
  onResendVerificationEmail,
  onRefreshVerificationStatus,
  onOpenNewProjectModal,
  onSelectProject,
  onNavigateSection,
  onFeedback,
}) => {
  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <AuthGatePanel
          initialMode="login"
          title="Acesse seu Painel & Perfil"
          subtitle="Entre ou crie sua conta gratuita para configurar seu perfil real de Cliente ou Profissional Freelancer."
          onSuccess={(msg) => onFeedback({ type: 'success', text: msg })}
        />
      </div>
    );
  }

  return (
    <UserDashboardPanel
      userProfile={currentUser}
      userEmail={userEmail}
      projects={projects}
      bidsByProject={bidsByProject}
      worklogsByProject={worklogsByProject}
      reviews={reviews}
      onSaveProfile={onSaveProfile}
      onResendVerificationEmail={onResendVerificationEmail}
      onRefreshVerificationStatus={onRefreshVerificationStatus}
      onOpenNewProjectModal={() => {
        if (!requireVerifiedAuth()) return;
        onOpenNewProjectModal();
      }}
      onSelectProjectAndNavigate={(projectId, section) => {
        if (projectId) onSelectProject(projectId);
        onNavigateSection(section);
      }}
    />
  );
};

export default UserPanelRouteView;
