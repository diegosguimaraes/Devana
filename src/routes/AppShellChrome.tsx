import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { ShellSection } from '../components/layout/AppShell';
import type { MarketplaceTab } from '../features/projects/types';
import { PROJECT_CATEGORIES } from '../lib/constants';

export const MarketplaceSubHeaderBar: React.FC<{
  categoryFilter: string;
  onSelectCategory: (cat: string) => void;
}> = ({ categoryFilter, onSelectCategory }) => (
  <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 lg:px-8 py-2">
    <div className="max-w-[1380px] mx-auto flex items-center gap-1.5 overflow-x-auto text-xs">
      {PROJECT_CATEGORIES.map((cat) => {
        const active = categoryFilter === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? 'bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  </div>
);

export const FeedbackBanner: React.FC<{
  feedback: { type: 'success' | 'error'; text: string } | null;
  onClose: () => void;
}> = ({ feedback, onClose }) => (
  <AnimatePresence>
    {feedback && (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        role={feedback.type === 'error' ? 'alert' : 'status'}
        aria-live="polite"
        className={`border-b px-4 sm:px-6 lg:px-8 py-2.5 text-xs ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200'
        }`}
      >
        <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar aviso"
            className="hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const AppFooter: React.FC<{
  onGoHome: () => void;
  onNavigateSection: (section: ShellSection, tab?: MarketplaceTab) => void;
}> = ({ onGoHome, onNavigateSection }) => (
  <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 lg:px-10 py-6 mt-12 mb-16 md:mb-0">
    <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
      <div className="flex items-center gap-3">
        <span className="font-display font-bold text-base text-[#2D1B4E] dark:text-white">
          Devana
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Plataforma Gratuita de Freelancers de Tecnologia &amp; Pagamentos em Garantia
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={onGoHome}
          className="hover:text-[var(--primary)] transition-colors cursor-pointer"
        >
          Início
        </button>
        <button
          type="button"
          onClick={() => onNavigateSection('marketplace', 'projects')}
          className="hover:text-[var(--primary)] transition-colors cursor-pointer"
        >
          Encontre Trabalho
        </button>
        <button
          type="button"
          onClick={() => onNavigateSection('user_panel')}
          className="hover:text-[var(--primary)] transition-colors cursor-pointer"
        >
          Meu Painel &amp; Perfil
        </button>
        <button
          type="button"
          onClick={() => onNavigateSection('workspace')}
          className="hover:text-[var(--primary)] transition-colors cursor-pointer"
        >
          Diário de Trabalho
        </button>
        <button
          type="button"
          onClick={() => onNavigateSection('reports')}
          className="hover:text-[var(--primary)] transition-colors cursor-pointer"
        >
          Exportar PDF/CSV
        </button>
      </div>
    </div>
  </footer>
);
