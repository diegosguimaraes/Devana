import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { SafeImage } from '../components/ui';
import { SpecialistsDirectory } from '../features/profile/components/SpecialistsDirectory';
import type { SpecialistSortOption } from '../features/profile/types';
import { MarketplaceSidebar } from '../features/projects/components/MarketplaceSidebar';
import { ProjectFeedList } from '../features/projects/components/ProjectFeedList';
import type { MarketplaceTab, ProjectSortOption } from '../features/projects/types';
import { ProjectDetailPanel } from '../features/proposals/components/ProjectDetailPanel';
import type { DetailPanelTab, SubmitBidPayload } from '../features/proposals/types';
import {
  ActiveUserProfileData,
  AppBid,
  AppChatMessage,
  AppProject,
  GENERATED_ASSETS,
  SpecialistProfile,
} from '../types/domain';

export interface MarketplaceRouteViewProps {
  currentUser: ActiveUserProfileData | null;
  marketplaceTab: MarketplaceTab;
  onSelectTab: (tab: MarketplaceTab) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  projects: AppProject[];
  filteredProjects: AppProject[];
  filteredSpecialists: SpecialistProfile[];
  bidsByProject: Record<string, AppBid[]>;
  selectedProject: AppProject | null;
  currentBids: AppBid[];
  currentMessages: AppChatMessage[];
  isProjectsSyncing: boolean;
  metricsSummary: {
    totalEscrowBrl: number;
    totalHours: number;
    totalCommits: number;
    averageRating: number;
  };
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  budgetFilter: string;
  onBudgetChange: (budget: string) => void;
  projectSortBy: ProjectSortOption;
  onProjectSortChange: (sort: ProjectSortOption) => void;
  specialistSortBy: SpecialistSortOption;
  onSpecialistSortChange: (sort: SpecialistSortOption) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  detailPanelTab: DetailPanelTab;
  onDetailTabChange: (tab: DetailPanelTab) => void;
  requireVerifiedAuth: () => boolean;
  onOpenNewProject: () => void;
  onSelectProject: (projectId: string) => void;
  onSubmitBid: (
    project: AppProject,
    user: ActiveUserProfileData,
    payload: SubmitBidPayload
  ) => Promise<string>;
  onAcceptBid: (bid: AppBid) => void;
  onSelectSpecialist: (specialist: SpecialistProfile) => void;
  onOpenUserPanel: () => void;
  onOpenWorkspace: () => void;
  onOpenEscrow: () => void;
  onOpenAuthModal: (mode: 'login' | 'register', role?: 'freelancer' | 'client') => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
  onBidSuccessNotify: (projectTitle: string, amount: number) => void;
  onBidErrorToast: () => void;
}

export const MarketplaceRouteView: React.FC<MarketplaceRouteViewProps> = ({
  currentUser,
  marketplaceTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  projects,
  filteredProjects,
  filteredSpecialists,
  bidsByProject,
  selectedProject,
  currentBids,
  currentMessages,
  isProjectsSyncing,
  metricsSummary,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  budgetFilter,
  onBudgetChange,
  projectSortBy,
  onProjectSortChange,
  specialistSortBy,
  onSpecialistSortChange,
  hasActiveFilters,
  onClearFilters,
  detailPanelTab,
  onDetailTabChange,
  requireVerifiedAuth,
  onOpenNewProject,
  onSelectProject,
  onSubmitBid,
  onAcceptBid,
  onSelectSpecialist,
  onOpenUserPanel,
  onOpenWorkspace,
  onOpenEscrow,
  onOpenAuthModal,
  onFeedback,
  onBidSuccessNotify,
  onBidErrorToast,
}) => {
  return (
    <div className="space-y-7">
      {/* MARKETPLACE TOP BANNER (Clean Editorial Split, Zero Bento Grid) */}
      <section className="rounded-2xl bg-gradient-to-br from-[#2D1B4E] via-[#3B2063] to-[#1E295B] text-white border border-indigo-900/40 p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-sky-300">
              <span>100% Gratuito (0% Comissão)</span>
              <span aria-hidden="true">·</span>
              <span>Pagamento em Garantia (Escrow)</span>
              <span aria-hidden="true">·</span>
              <span>Commits Auditados</span>
            </div>

            <h1
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Contrate os melhores desenvolvedores e arquitetos de software sob demanda.
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-xl">
              Publique seu projeto gratuitamente, receba propostas técnicas em minutos,
              acompanhe cada commit pelo Diário de Trabalho e libere 100% do pagamento
              após aprovação.
            </p>

            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search
                  className="w-4 h-4 text-slate-500 ml-3 shrink-0"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  aria-label="Buscar projetos ou habilidades"
                  placeholder="Buscar projetos ou habilidades (ex: Node.js, React, IA)..."
                  className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white bg-transparent rounded-md"
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectTab('projects')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    marketplaceTab === 'projects'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Ver Projetos ({filteredProjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('freelancers')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    marketplaceTab === 'freelancers'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Contratar Devs ({filteredSpecialists.length})
                </button>
              </div>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-white/15 shadow-lg aspect-[16/9]">
            <SafeImage
              src={GENERATED_ASSETS.heroWorkspace}
              alt="Especialista de tecnologia trabalhando em arquitetura de sistemas"
              className="w-full h-full object-cover"
              fallbackInitials="DV"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1030]/95 via-[#1A1030]/35 to-transparent flex flex-col justify-end p-6 text-white">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Garantia Devana 100% Gratuita</span>
              </div>
              <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                O valor acordado fica protegido em custódia e cada entrega é comprovada
                com commits reais do GitHub e relatórios exportáveis em PDF/CSV.
              </p>
            </div>
          </div>
        </div>

        <dl className="pt-5 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-0 lg:divide-x lg:divide-white/15 text-xs">
          <div className="lg:pr-6">
            <dt className="text-indigo-100">Em Garantia</dt>
            <dd className="font-mono tabular-nums font-bold text-lg text-white mt-0.5">
              R$ {metricsSummary.totalEscrowBrl.toLocaleString('pt-BR')}
            </dd>
          </div>
          <div className="lg:px-6">
            <dt className="text-indigo-100">Horas Auditadas</dt>
            <dd className="font-mono tabular-nums font-bold text-lg text-white mt-0.5">
              {metricsSummary.totalHours.toFixed(1)} h
            </dd>
          </div>
          <div className="lg:px-6">
            <dt className="text-indigo-100">Commits Git</dt>
            <dd className="font-mono tabular-nums font-bold text-lg text-white mt-0.5">
              {metricsSummary.totalCommits} entregas
            </dd>
          </div>
          <div className="lg:pl-6">
            <dt className="text-indigo-100">Taxa Devana</dt>
            <dd className="font-mono tabular-nums font-bold text-lg text-emerald-400 mt-0.5">
              R$ 0,00 (0%)
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <MarketplaceSidebar
          currentUser={currentUser}
          marketplaceTab={marketplaceTab}
          onSelectTab={onSelectTab}
          projectsCount={filteredProjects.length}
          specialistsCount={filteredSpecialists.length}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          budgetFilter={budgetFilter}
          onBudgetChange={onBudgetChange}
          onOpenUserPanel={onOpenUserPanel}
          onOpenWorkspace={onOpenWorkspace}
          onOpenAuthModal={(mode) => onOpenAuthModal(mode)}
        />

        <div className="lg:col-span-9 space-y-6">
          {marketplaceTab === 'projects' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <ProjectFeedList
                projects={filteredProjects}
                totalProjectsCount={projects.length}
                bidsByProject={bidsByProject}
                selectedProjectId={selectedProject?.id}
                isSyncing={isProjectsSyncing}
                hasActiveFilters={hasActiveFilters}
                sortBy={projectSortBy}
                onSortChange={onProjectSortChange}
                onClearFilters={onClearFilters}
                onOpenNewProject={() => {
                  if (!requireVerifiedAuth()) return;
                  onOpenNewProject();
                }}
                onSelectProject={onSelectProject}
              />

              <ProjectDetailPanel
                selectedProject={selectedProject}
                currentUser={currentUser}
                bids={currentBids}
                messages={currentMessages}
                isSyncing={isProjectsSyncing}
                activeTab={detailPanelTab}
                onTabChange={onDetailTabChange}
                requireVerifiedAuth={requireVerifiedAuth}
                onSubmitBid={onSubmitBid}
                onAcceptBid={onAcceptBid}
                onOpenAuthModal={() => onOpenAuthModal('login')}
                onOpenWorkspace={onOpenWorkspace}
                onOpenEscrow={onOpenEscrow}
                onFeedback={onFeedback}
                onBidSuccessNotify={onBidSuccessNotify}
                onBidErrorToast={onBidErrorToast}
              />
            </div>
          ) : (
            <SpecialistsDirectory
              specialists={filteredSpecialists}
              currentUser={currentUser}
              sortBy={specialistSortBy}
              onSortChange={onSpecialistSortChange}
              onSelectSpecialist={onSelectSpecialist}
              onInviteSpecialist={() => {
                if (!requireVerifiedAuth()) return;
                onOpenNewProject();
              }}
              onOpenUserPanel={onOpenUserPanel}
              onOpenRegisterFreelancer={() => onOpenAuthModal('register', 'freelancer')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceRouteView;
