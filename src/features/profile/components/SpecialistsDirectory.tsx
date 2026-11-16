import React from 'react';
import { Users } from 'lucide-react';
import { Button, EmptyState, SafeImage } from '../../../components/ui';
import type { ActiveUserProfileData, SpecialistProfile } from '../../../types/domain';
import type { SpecialistSortOption } from '../types';

export interface SpecialistsDirectoryProps {
  specialists: SpecialistProfile[];
  currentUser: ActiveUserProfileData | null;
  sortBy: SpecialistSortOption;
  onSortChange: (sort: SpecialistSortOption) => void;
  onSelectSpecialist: (specialist: SpecialistProfile) => void;
  onInviteSpecialist: () => void;
  onOpenUserPanel: () => void;
  onOpenRegisterFreelancer: () => void;
}

export const SpecialistsDirectory: React.FC<SpecialistsDirectoryProps> = ({
  specialists,
  currentUser,
  sortBy,
  onSortChange,
  onSelectSpecialist,
  onInviteSpecialist,
  onOpenUserPanel,
  onOpenRegisterFreelancer,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-6 py-4">
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          {specialists.length} especialistas de tecnologia verificados
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-[var(--primary)] font-medium">
            Perfis reais no Firestore
          </span>
          <select
            aria-label="Ordenar especialistas"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SpecialistSortOption)}
            className="h-8 px-2.5 text-xs font-medium bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] cursor-pointer"
          >
            <option value="reputation_desc">Melhor avaliação</option>
            <option value="projects_desc">Mais entregas</option>
            <option value="rate_asc">Menor valor/hora</option>
            <option value="rate_desc">Maior valor/hora</option>
          </select>
        </div>
      </div>

      {specialists.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="Nenhum especialista encontrado"
          description="Tente outro termo de busca ou cadastre seu próprio perfil profissional gratuito para aparecer no diretório."
          actionLabel={
            currentUser
              ? 'Publicar Meu Perfil de Freelancer'
              : 'Cadastrar Perfil de Freelancer'
          }
          onAction={() => {
            if (currentUser) {
              onOpenUserPanel();
            } else {
              onOpenRegisterFreelancer();
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {specialists.map((spec) => (
            <article
              key={spec.uid}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between gap-5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-subtle)] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <SafeImage
                      src={spec.avatarUrl}
                      alt={spec.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-display text-base font-bold text-[var(--text-primary)] truncate">
                        {spec.displayName}
                      </h3>
                      <p className="text-xs font-semibold text-[var(--primary)] truncate">
                        {spec.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono tabular-nums text-base font-bold text-[var(--text-primary)] block">
                      R$ {spec.hourlyRate}/h
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      0% taxa
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                  {spec.bio}
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] space-y-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--text-muted)] font-mono tabular-nums">
                  <span className="text-amber-500 font-bold">
                    {spec.completedProjects > 0
                      ? `${spec.reputationScore.toFixed(2)} ★`
                      : 'Novo'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{spec.completedProjects} entregas</span>
                  {spec.githubUsername && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>@{spec.githubUsername.trim()}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onSelectSpecialist(spec)}
                  >
                    Ver Perfil Público
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={onInviteSpecialist}
                  >
                    Convidar
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
