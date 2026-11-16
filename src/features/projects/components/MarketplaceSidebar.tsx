import React from 'react';
import { Briefcase, Users } from 'lucide-react';
import { SafeImage } from '../../../components/ui';
import { PROJECT_CATEGORIES } from '../../../lib';
import type { ActiveUserProfileData } from '../../../types/domain';
import type { MarketplaceTab } from '../types';

export interface MarketplaceSidebarProps {
  currentUser: ActiveUserProfileData | null;
  marketplaceTab: MarketplaceTab;
  onSelectTab: (tab: MarketplaceTab) => void;
  projectsCount: number;
  specialistsCount: number;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  budgetFilter: string;
  onBudgetChange: (budget: string) => void;
  onOpenUserPanel: () => void;
  onOpenWorkspace: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

export const MarketplaceSidebar: React.FC<MarketplaceSidebarProps> = ({
  currentUser,
  marketplaceTab,
  onSelectTab,
  projectsCount,
  specialistsCount,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  budgetFilter,
  onBudgetChange,
  onOpenUserPanel,
  onOpenWorkspace,
  onOpenAuthModal,
}) => {
  return (
    <aside className="lg:col-span-3 space-y-5">
      {currentUser ? (
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <SafeImage
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentUser.displayName}
              </h2>
              <p className="text-[11px] text-indigo-600 dark:text-sky-400 font-semibold">
                {currentUser.roleType === 'client'
                  ? 'Conta Cliente (Contratante)'
                  : 'Profissional Freelancer'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Reputação</span>
              <span className="font-mono tabular-nums font-bold text-amber-500">
                {currentUser.completedProjects > 0
                  ? `${currentUser.reputationScore.toFixed(2)} ★`
                  : 'Novo'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Projetos Concluídos
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                {currentUser.completedProjects}
              </span>
            </div>
            {currentUser.roleType === 'freelancer' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Valor Hora</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  R$ {currentUser.hourlyRate}/h
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenUserPanel}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              Meu Painel &amp; Perfil
            </button>
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 dark:text-sky-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 rounded-lg transition-colors cursor-pointer"
            >
              Abrir Diário de Trabalho
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-2xs">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-sky-400">
              Conta Devana
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Entre ou crie sua conta gratuita
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Autentique-se para configurar seu perfil de Cliente ou Freelancer, publicar
              projetos e enviar propostas reais.
            </p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#2D1B4E] hover:bg-[#3B2063] rounded-lg transition-colors cursor-pointer"
            >
              Entrar na Minha Conta
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('register')}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
            >
              Criar Conta Gratuita
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xs text-xs">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
            Modo de Visualização
          </h3>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onSelectTab('projects')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                marketplaceTab === 'projects'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Encontre Trabalho</span>
              </span>
              <span className="font-mono tabular-nums">{projectsCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('freelancers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                marketplaceTab === 'freelancers'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                <span>Contrate Freelancers</span>
              </span>
              <span className="font-mono tabular-nums">{specialistsCount}</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2.5">
            Área de Tecnologia
          </h3>
          <div className="space-y-1.5">
            {PROJECT_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
              >
                <input
                  type="radio"
                  name="devana-cat"
                  checked={categoryFilter === cat}
                  onChange={() => onCategoryChange(cat)}
                  className="accent-indigo-600"
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2.5">
            Status do Projeto
          </h3>
          <div className="space-y-1.5">
            {[
              { id: 'all', label: 'Todos os status' },
              { id: 'open', label: 'Abertos a propostas' },
              { id: 'in_progress', label: 'Em andamento' },
              { id: 'completed', label: 'Concluídos' },
            ].map((st) => (
              <label
                key={st.id}
                className="flex items-center gap-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
              >
                <input
                  type="radio"
                  name="devana-status"
                  checked={statusFilter === st.id}
                  onChange={() => onStatusChange(st.id)}
                  className="accent-indigo-600"
                />
                <span>{st.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2.5">
            Faixa de Orçamento
          </h3>
          <div className="space-y-1.5">
            {[
              { id: 'all', label: 'Qualquer valor' },
              { id: 'up_to_10k', label: 'Até R$ 10.000' },
              { id: 'over_10k', label: 'Acima de R$ 10.000' },
            ].map((bf) => (
              <label
                key={bf.id}
                className="flex items-center gap-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
              >
                <input
                  type="radio"
                  name="devana-budget"
                  checked={budgetFilter === bf.id}
                  onChange={() => onBudgetChange(bf.id)}
                  className="accent-indigo-600"
                />
                <span>{bf.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
