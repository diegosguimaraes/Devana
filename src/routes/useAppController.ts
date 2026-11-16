import { useEffect, useState } from 'react';
import type { AppBid, SpecialistProfile, UserRoleType } from '../types/domain';
import { useAuth, useEscrow, useProjects, useRealtime, useToast } from '../hooks';
import { useProjectFilters } from '../features/projects/hooks/useProjects';
import type { DetailPanelTab } from '../features/proposals/types';
import { useSpecialistDirectory } from '../features/profile/hooks/useSpecialistDirectory';
import type { AppModalsProps, AppSectionRoutesProps } from './AppRoutes';
import { useAppRouter } from './useAppRouter';

export function useAppController() {
  const {
    viewMode,
    activeSection,
    marketplaceTab,
    navigateToLanding,
    navigateToSection,
    setMarketplaceTab,
  } = useAppRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [detailPanelTab, setDetailPanelTab] = useState<DetailPanelTab>('proposals');
  const [selectedSpecialistProfile, setSelectedSpecialistProfile] =
    useState<SpecialistProfile | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalRole, setAuthModalRole] = useState<UserRoleType>('freelancer');
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const auth = useAuth();
  const domain = useProjects({
    authReady: auth.authReady,
    firebaseUser: auth.firebaseUser,
  });
  const { acceptBidAndFundEscrow, completeAndReleaseEscrow } = useEscrow();
  const { pushToast } = useToast();

  const filters = useProjectFilters(
    domain.projects,
    domain.bidsByProject,
    searchQuery,
    setSearchQuery
  );
  const { specialistSortBy, setSpecialistSortBy, filteredSpecialists } =
    useSpecialistDirectory(domain.specialists, searchQuery);

  const realtime = useRealtime({
    currentUser: auth.currentUser,
    firebaseUser: auth.firebaseUser,
    selectedProjectId: domain.selectedProject?.id || '',
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const openAuthModal = (
    mode: 'login' | 'register',
    role: UserRoleType = 'freelancer'
  ) => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  const requireVerifiedAuth = (): boolean => {
    if (!auth.firebaseUser) {
      openAuthModal('login');
      setFormFeedback({
        type: 'error',
        text: 'Faça login ou crie sua conta na Devana para executar esta ação.',
      });
      return false;
    }
    if (!auth.firebaseUser.emailVerified) {
      navigateToSection('user_panel');
      setFormFeedback({
        type: 'error',
        text: 'Verifique seu e-mail para liberar ações de escrita e criação no Firestore.',
      });
      return false;
    }
    return true;
  };

  const handleAcceptBid = async (bid: AppBid) => {
    if (!domain.selectedProject || !requireVerifiedAuth() || !auth.currentUser) return;
    try {
      const res = await acceptBidAndFundEscrow({
        project: domain.selectedProject,
        bid,
        currentUser: auth.currentUser,
        projectBids: domain.bidsByProject[domain.selectedProject.id] || [],
      });
      if (res.ok === false) {
        setFormFeedback({ type: 'error', text: res.error });
        return;
      }
      realtime.pushAlert(
        `Proposta de ${res.freelancerName} aceita! R$ ${res.amount.toLocaleString('pt-BR')} depositados em Garantia Segura (0% taxa).`,
        'escrow'
      );
      pushToast({
        title: 'Garantia Escrow ativada!',
        description: `Contrato iniciado com ${res.freelancerName} no valor de R$ ${res.amount.toLocaleString('pt-BR')}.`,
        tone: 'success',
      });
      setFormFeedback({
        type: 'success',
        text: `Proposta aceita! R$ ${res.amount.toLocaleString('pt-BR')} registrados na Garantia Devana.`,
      });
    } catch {
      pushToast({
        title: 'Erro ao ativar garantia',
        description: 'Não foi possível concluir a contratação agora. Tente novamente.',
        tone: 'error',
      });
    }
  };

  const handleReleaseEscrow = async () => {
    if (!domain.selectedProject || !requireVerifiedAuth() || !auth.currentUser) return;
    const res = await completeAndReleaseEscrow({
      project: domain.selectedProject,
      currentUser: auth.currentUser,
    });
    if (res.ok === false) {
      setFormFeedback({ type: 'error', text: res.error });
      return;
    }
    realtime.pushAlert(
      `Pagamento integral de R$ ${res.budget.toLocaleString('pt-BR')} liberado para ${res.freelancerName}!`,
      'escrow'
    );
    setFormFeedback({
      type: 'success',
      text: 'Projeto concluído! 100% do valor em garantia foi liberado ao profissional.',
    });
  };

  const breadcrumbSublabel =
    activeSection === 'marketplace'
      ? filters.categoryFilter === 'Todos'
        ? marketplaceTab === 'projects'
          ? 'Projetos Abertos'
          : 'Diretório de Devs'
        : filters.categoryFilter
      : activeSection === 'workspace' || activeSection === 'escrow'
        ? domain.selectedProject?.title
        : activeSection === 'user_panel'
          ? auth.currentUser?.displayName
          : undefined;

  const sectionRoutesProps: AppSectionRoutesProps = {
    activeSection,
    marketplaceProps: {
      currentUser: auth.currentUser,
      marketplaceTab,
      onSelectTab: setMarketplaceTab,
      searchQuery,
      onSearchChange: setSearchQuery,
      projects: domain.projects,
      filteredProjects: filters.filteredProjects,
      filteredSpecialists,
      bidsByProject: domain.bidsByProject,
      selectedProject: domain.selectedProject,
      currentBids: domain.currentBids,
      currentMessages: domain.currentMessages,
      isProjectsSyncing: domain.isProjectsSyncing,
      metricsSummary: domain.metricsSummary,
      categoryFilter: filters.categoryFilter,
      onCategoryChange: filters.setCategoryFilter,
      statusFilter: filters.statusFilter,
      onStatusChange: filters.setStatusFilter,
      budgetFilter: filters.budgetFilter,
      onBudgetChange: filters.setBudgetFilter,
      projectSortBy: filters.projectSortBy,
      onProjectSortChange: filters.setProjectSortBy,
      specialistSortBy,
      onSpecialistSortChange: setSpecialistSortBy,
      hasActiveFilters: filters.hasActiveFilters,
      onClearFilters: filters.clearProjectFilters,
      detailPanelTab,
      onDetailTabChange: setDetailPanelTab,
      requireVerifiedAuth,
      onOpenNewProject: () => setIsNewProjectModalOpen(true),
      onSelectProject: domain.setSelectedProjectId,
      onSubmitBid: domain.submitBid,
      onAcceptBid: handleAcceptBid,
      onSelectSpecialist: setSelectedSpecialistProfile,
      onOpenUserPanel: () => navigateToSection('user_panel'),
      onOpenWorkspace: () => navigateToSection('workspace'),
      onOpenEscrow: () => navigateToSection('escrow'),
      onOpenAuthModal: openAuthModal,
      onFeedback: setFormFeedback,
      onBidSuccessNotify: (projectTitle, amount) => {
        realtime.pushAlert(
          `Nova proposta de ${auth.currentUser?.displayName || 'Você'} (R$ ${amount.toLocaleString('pt-BR')}) em ${projectTitle}`,
          'bid'
        );
        pushToast({
          title: 'Proposta enviada com sucesso!',
          description: `Proposta de R$ ${amount.toLocaleString('pt-BR')} registrada em "${projectTitle}" (0% comissão).`,
          tone: 'success',
        });
        setFormFeedback({
          type: 'success',
          text: 'Proposta enviada e registrada no Firestore!',
        });
      },
      onBidErrorToast: () =>
        pushToast({
          title: 'Falha ao enviar proposta',
          description:
            'Verifique os valores informados e sua conexão antes de tentar novamente.',
          tone: 'error',
        }),
    },
    workspaceProps: {
      currentUser: auth.currentUser,
      selectedProject: domain.selectedProject,
      projects: domain.projects,
      currentWorklogs: domain.currentWorklogs,
      currentMessages: domain.currentMessages,
      roomUsers: realtime.roomUsers,
      typingUser: realtime.typingUser,
      requireVerifiedAuth,
      onSelectProject: domain.setSelectedProjectId,
      onLogWorklog: domain.logWorklog,
      onSendChatMessage: domain.sendChatMessage,
      onEmitTyping: realtime.emitTyping,
      onPushAlert: realtime.pushAlert,
      onGoToMarketplace: () => navigateToSection('marketplace'),
      onFeedback: setFormFeedback,
    },
    escrowProps: {
      currentUser: auth.currentUser,
      selectedProject: domain.selectedProject,
      currentReviews: domain.currentReviews,
      allReviews: domain.allReviews,
      requireVerifiedAuth,
      onReleaseEscrow: handleReleaseEscrow,
      onSubmitReview: domain.submitReview,
      onGoToMarketplace: () => navigateToSection('marketplace'),
      onFeedback: setFormFeedback,
    },
    reportsProps: {
      currentUser: auth.currentUser,
      userEmail: auth.firebaseUser?.email || null,
      projects: domain.projects,
      selectedProject: domain.selectedProject,
      bidsByProject: domain.bidsByProject,
      worklogsByProject: domain.worklogsByProject,
      reviewsByProject: domain.reviewsByProject,
      allWorklogs: domain.allWorklogs,
      metricsSummary: domain.metricsSummary,
      backupPassphrase,
      onBackupPassphraseChange: setBackupPassphrase,
      requireVerifiedAuth,
      onOpenAuthModal: () => openAuthModal('login'),
      onFeedback: setFormFeedback,
    },
    securityProps: {
      authReady: auth.authReady,
      isAuthenticated: Boolean(auth.firebaseUser),
      isEmailVerified: Boolean(auth.firebaseUser?.emailVerified),
      userEmail: auth.firebaseUser?.email || null,
      currentUser: auth.currentUser,
      backupPassphrase,
      pushPrefs: {
        pushEnabled: realtime.pushEnabled,
        notifyOnBid: realtime.notifyOnBid,
        notifyOnMessage: realtime.notifyOnMessage,
        notifyOnEscrow: realtime.notifyOnEscrow,
      },
      requireVerifiedAuth,
      onOpenAuthModal: () => openAuthModal('login'),
      onFeedback: setFormFeedback,
    },
    userPanelProps: {
      currentUser: auth.currentUser,
      userEmail: auth.firebaseUser?.email || null,
      projects: domain.projects,
      bidsByProject: domain.bidsByProject,
      worklogsByProject: domain.worklogsByProject,
      reviews: domain.allReviews,
      requireVerifiedAuth,
      onSaveProfile: async (updated) => {
        if (!requireVerifiedAuth()) return;
        const res = await auth.saveUserProfile(updated);
        if (res.ok) setFormFeedback({ type: 'success', text: res.message });
      },
      onResendVerificationEmail: async () => {
        const res = await auth.resendVerificationEmail();
        setFormFeedback({
          type: res.ok ? 'success' : 'error',
          text: res.message,
        });
      },
      onRefreshVerificationStatus: async () => {
        const res = await auth.refreshVerificationStatus();
        setFormFeedback({
          type: res.verified ? 'success' : 'error',
          text: res.message,
        });
      },
      onOpenNewProjectModal: () => setIsNewProjectModalOpen(true),
      onSelectProject: domain.setSelectedProjectId,
      onNavigateSection: navigateToSection,
      onFeedback: setFormFeedback,
    },
  };

  const modalsProps: AppModalsProps = {
    isNewProjectModalOpen,
    onCloseNewProjectModal: () => setIsNewProjectModalOpen(false),
    currentUser: auth.currentUser,
    onSubmitProject: domain.createProject,
    onProjectCreated: (title, budget) => {
      realtime.pushAlert(
        `Novo projeto publicado: ${title} (R$ ${budget.toLocaleString('pt-BR')})`,
        'bid'
      );
      setFormFeedback({
        type: 'success',
        text: 'Projeto publicado gratuitamente no Firestore!',
      });
    },
    isAuthModalOpen,
    authModalMode,
    authModalRole,
    onCloseAuthModal: () => setIsAuthModalOpen(false),
    onAuthSuccess: (msg) => {
      setIsAuthModalOpen(false);
      navigateToSection('user_panel');
      setFormFeedback({ type: 'success', text: msg });
    },
    selectedSpecialistProfile,
    allReviews: domain.allReviews,
    onCloseSpecialistProfile: () => setSelectedSpecialistProfile(null),
    onInviteSpecialist: () => {
      if (requireVerifiedAuth()) setIsNewProjectModalOpen(true);
    },
    onFeedback: setFormFeedback,
  };

  return {
    viewMode,
    activeSection,
    darkMode,
    toggleDarkMode: () => setDarkMode((prev) => !prev),
    isOnline,
    searchQuery,
    setSearchQuery,
    categoryFilter: filters.categoryFilter,
    setCategoryFilter: filters.setCategoryFilter,
    formFeedback,
    clearFeedback: () => setFormFeedback(null),
    breadcrumbSublabel,
    navigateToLanding,
    navigateToSection,
    openAuthModal,
    requireVerifiedAuth,
    openNewProjectIfVerified: () => {
      if (requireVerifiedAuth()) setIsNewProjectModalOpen(true);
    },
    signOutWithFeedback: async () => {
      await auth.signOutUser();
      setFormFeedback({
        type: 'success',
        text: 'Sessão encerrada com segurança.',
      });
    },
    enterMarketplaceFromLanding: (
      initialTab?: 'projects' | 'freelancers',
      category?: string,
      search?: string
    ) => {
      if (category) filters.setCategoryFilter(category);
      if (typeof search === 'string') setSearchQuery(search);
      navigateToSection('marketplace', initialTab || 'projects');
      if (initialTab !== 'freelancers') domain.triggerInitialSync(380);
    },
    currentUser: auth.currentUser,
    projects: domain.projects,
    availableSpecialists: domain.specialists.filter((s) => s.isAvailableForHire),
    metricsSummary: domain.metricsSummary,
    notifications: realtime.notifications,
    pushPrefs: {
      pushEnabled: realtime.pushEnabled,
      setPushEnabled: realtime.setPushEnabled,
      notifyOnBid: realtime.notifyOnBid,
      setNotifyOnBid: realtime.setNotifyOnBid,
      notifyOnEscrow: realtime.notifyOnEscrow,
      setNotifyOnEscrow: realtime.setNotifyOnEscrow,
      notifyOnMessage: realtime.notifyOnMessage,
      setNotifyOnMessage: realtime.setNotifyOnMessage,
    },
    sectionRoutesProps,
    modalsProps,
  };
}
