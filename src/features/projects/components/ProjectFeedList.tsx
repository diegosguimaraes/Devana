import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase } from 'lucide-react';
import { Badge, EmptyState } from '../../../components/ui';
import { ProjectCardSkeleton } from '../../../components/ProjectCardSkeleton';
import type { AppBid, AppProject } from '../../../types/domain';
import type { ProjectSortOption } from '../types';

export interface ProjectFeedListProps {
  projects: AppProject[];
  totalProjectsCount: number;
  bidsByProject: Record<string, AppBid[]>;
  selectedProjectId?: string;
  isSyncing: boolean;
  hasActiveFilters: boolean;
  sortBy: ProjectSortOption;
  onSortChange: (sort: ProjectSortOption) => void;
  onClearFilters: () => void;
  onOpenNewProject: () => void;
  onSelectProject: (projectId: string) => void;
}

export const ProjectFeedList: React.FC<ProjectFeedListProps> = ({
  projects,
  totalProjectsCount,
  bidsByProject,
  selectedProjectId,
  isSyncing,
  hasActiveFilters,
  sortBy,
  onSortChange,
  onClearFilters,
  onOpenNewProject,
  onSelectProject,
}) => {
  return (
    <div className="xl:col-span-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl px-6 py-4 shadow-[0_2px_12px_-3px_rgba(45,27,78,0.05)] font-sans">
        <div className="flex flex-wrap items-center gap-3">
          {isSyncing ? (
            <div className="flex items-center gap-2.5" role="status" aria-live="polite">
              <span className="inline-block w-2 h-2 rounded-full bg-[#6C3CE9] dark:bg-sky-400 animate-pulse" />
              <span className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                Sincronizando projetos...
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-[13px] font-bold text-[#2D1B4E] dark:text-slate-200">
              {projects.length}{' '}
              {projects.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            0% comissão
          </span>
          <select
            aria-label="Ordenar projetos"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as ProjectSortOption)}
            className="h-8 px-2.5 text-xs font-medium bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] cursor-pointer"
          >
            <option value="recent">Mais recentes</option>
            <option value="budget_desc">Maior orçamento</option>
            <option value="budget_asc">Menor orçamento</option>
            <option value="deadline_asc">Menor prazo</option>
            <option value="bids_asc">Menos propostas</option>
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSyncing ? (
          <motion.div
            key="projects-skeleton-feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-busy="true"
            aria-label="Carregando cartões de projeto"
          >
            {[0, 1, 2].map((skeletonIdx) => (
              <ProjectCardSkeleton key={skeletonIdx} index={skeletonIdx} />
            ))}
          </motion.div>
        ) : projects.length === 0 ? (
          <motion.div
            key="projects-empty-feed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyState
              icon={<Briefcase className="w-5 h-5" />}
              title={
                totalProjectsCount === 0
                  ? 'Nenhum projeto publicado ainda'
                  : 'Nenhum projeto corresponde aos filtros'
              }
              description={
                totalProjectsCount === 0
                  ? 'Publique o primeiro desafio técnico gratuitamente e receba propostas diretas sem taxa de intermediação.'
                  : 'Ajuste a categoria, faixa de orçamento ou termo de busca para visualizar mais oportunidades disponíveis.'
              }
              actionLabel={
                totalProjectsCount === 0
                  ? 'Publicar Primeiro Projeto'
                  : 'Limpar todos os filtros'
              }
              onAction={() => {
                if (totalProjectsCount === 0) {
                  onOpenNewProject();
                } else {
                  onClearFilters();
                }
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="projects-loaded-feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {projects.map((proj, idx) => {
              const isSelected = selectedProjectId === proj.id;
              const bidCount = (bidsByProject[proj.id] || []).length;
              return (
                <motion.article
                  key={proj.id}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.24,
                    delay: Math.min(idx * 0.045, 0.22),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => onSelectProject(proj.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProject(proj.id);
                    }
                  }}
                  className={`group font-sans bg-white dark:bg-[#111726] border rounded-2xl p-7 mb-5 flex flex-col gap-4 transition-all duration-200 active:scale-[0.995] cursor-pointer ${
                    isSelected
                      ? 'border-[#6C3CE9] dark:border-sky-400 ring-2 ring-[#6C3CE9]/15 dark:ring-sky-400/25 shadow-lg'
                      : 'border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg hover:border-[#6C3CE9]/50 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={
                            proj.status === 'completed'
                              ? 'success'
                              : proj.status === 'in_progress'
                                ? 'info'
                                : 'primary'
                          }
                        >
                          {proj.status === 'completed'
                            ? 'Concluído'
                            : proj.status === 'in_progress'
                              ? 'Em Execução'
                              : 'Aberto'}
                        </Badge>
                        <span className="text-xs font-bold text-[#6C3CE9] dark:text-sky-400">
                          {proj.category}
                        </span>
                      </div>

                      <h3 className="font-sans text-lg sm:text-[19px] font-bold tracking-[-0.018em] text-[#2D1B4E] dark:text-white group-hover:text-[#6C3CE9] dark:group-hover:text-sky-400 transition-colors leading-snug">
                        {proj.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>Prazo: {proj.deadlineDays} dias</span>
                        <span
                          aria-hidden="true"
                          className="text-slate-300 dark:text-slate-700"
                        >
                          ·
                        </span>
                        <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          {bidCount} {bidCount === 1 ? 'proposta' : 'propostas'}
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-slate-300 dark:text-slate-700"
                        >
                          ·
                        </span>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-[210px]">
                          Git: {proj.repoUrl}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 flex flex-col gap-1">
                      <span className="font-sans tabular-nums text-xl sm:text-[22px] font-extrabold tracking-tight text-[#2D1B4E] dark:text-white block leading-none">
                        R$ {proj.budget.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                        {proj.escrowStatus === 'funded'
                          ? 'Garantia Depositada'
                          : proj.escrowStatus === 'released'
                            ? 'Pagamento Liberado'
                            : 'Orçamento Fixo'}
                      </span>
                    </div>
                  </div>

                  <p className="font-sans text-sm text-slate-600 dark:text-slate-300 leading-[1.68] font-normal">
                    {proj.description}
                  </p>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {proj.ownerName}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-slate-300 dark:text-slate-700"
                      >
                        ·
                      </span>
                      <span className="text-amber-500 tabular-nums font-bold">
                        5.00 ★
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-slate-300 dark:text-slate-700"
                      >
                        ·
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Pagamento Verificado
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(proj.id);
                      }}
                      className={`px-5 py-2.5 font-sans text-xs sm:text-[13px] font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        proj.status === 'open'
                          ? 'bg-[#6C3CE9] hover:bg-[#5829D4] text-white shadow-sm hover:shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {proj.status === 'open'
                        ? 'Enviar Proposta'
                        : 'Ver Detalhes da Sprint'}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
