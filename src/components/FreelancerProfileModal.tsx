import React from 'react';
import {
  Star,
  FolderGit2,
  ShieldCheck,
  Award,
  CheckCircle2,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { Modal, Avatar, Badge, Button, EmptyState } from './ui';
import type { AppReview, SpecialistProfile } from '../types/domain';

export interface FreelancerProfileModalProps {
  specialist: SpecialistProfile | null;
  reviews: AppReview[];
  onClose: () => void;
  onInviteToProject: (specialist: SpecialistProfile) => void;
}

export const FreelancerProfileModal: React.FC<FreelancerProfileModalProps> = ({
  specialist,
  reviews,
  onClose,
  onInviteToProject,
}) => {
  if (!specialist) {
    return (
      <Modal open={false} onClose={onClose}>
        {null}
      </Modal>
    );
  }

  const specialistReviews = reviews.filter((r) => r.targetUserId === specialist.uid);
  const cleanGithub = specialist.githubUsername?.trim().replace(/^@/, '') || '';

  const earnedBadges: Array<{
    label: string;
    tone: 'success' | 'primary' | 'info' | 'warning';
    icon: React.ReactNode;
  }> = [
    {
      label: 'Identidade Verificada',
      tone: 'success',
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    {
      label: 'Repasse 100% (0% Taxa)',
      tone: 'primary',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
  ];

  if (cleanGithub) {
    earnedBadges.push({
      label: 'GitHub Conectado',
      tone: 'info',
      icon: <FolderGit2 className="w-3 h-3" />,
    });
  }

  if (specialist.completedProjects > 0 && specialist.reputationScore >= 4.7) {
    earnedBadges.push({
      label: 'Top Especialista',
      tone: 'warning',
      icon: <Award className="w-3 h-3" />,
    });
  }

  return (
    <Modal
      open={Boolean(specialist)}
      onClose={onClose}
      title="Perfil Público do Especialista"
      description="Portfólio técnico, selos verificados e histórico de avaliações na Devana."
      size="lg"
    >
      <div className="space-y-6 text-xs">
        {/* Top Profile Identity */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 p-5 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)]">
          <div className="flex items-start gap-4 min-w-0">
            <Avatar src={specialist.avatarUrl} name={specialist.displayName} size="lg" />
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] truncate">
                  {specialist.displayName}
                </h3>
                {specialist.isAvailableForHire && (
                  <Badge tone="success">Disponível</Badge>
                )}
              </div>
              <p className="text-xs font-semibold text-[var(--primary)]">
                {specialist.specialty}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {specialist.completedProjects > 0
                    ? specialist.reputationScore.toFixed(2)
                    : 'Novo'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{specialist.completedProjects} projetos concluídos</span>
              </div>
            </div>
          </div>

          <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] block">
              Taxa Horária
            </span>
            <span className="font-mono tabular-nums text-2xl font-bold text-[var(--text-primary)]">
              R$ {specialist.hourlyRate}
              <span className="text-xs font-normal text-[var(--text-muted)]">/h</span>
            </span>
          </div>
        </div>

        {/* Earned Verification Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {earnedBadges.map((b) => (
            <Badge key={b.label} tone={b.tone} icon={b.icon}>
              {b.label}
            </Badge>
          ))}
        </div>

        {/* Technical Bio & GitHub Portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] space-y-2">
            <h4 className="font-bold text-[var(--text-primary)]">
              Resumo Técnico &amp; Experiência
            </h4>
            <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {specialist.bio || 'Especialista de tecnologia verificado na Devana.'}
            </p>
          </div>

          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
                <span>Portfólio Git</span>
              </h4>
              {cleanGithub ? (
                <p className="font-mono text-[var(--text-secondary)] break-all">
                  github.com/{cleanGithub}
                </p>
              ) : (
                <p className="text-[var(--text-muted)]">
                  Repositório público ainda não vinculado pelo profissional.
                </p>
              )}
            </div>
            {cleanGithub && (
              <a
                href={`https://github.com/${encodeURIComponent(cleanGithub)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--primary)] hover:underline"
              >
                <span>Abrir Perfil GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Verified Reviews */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[var(--text-primary)]">
              Avaliações Verificadas ({specialistReviews.length})
            </h4>
            <span className="text-[11px] text-[var(--text-muted)]">
              Baseadas em entregas com Garantia Devana
            </span>
          </div>

          {specialistReviews.length === 0 ? (
            <EmptyState
              title="Nenhuma avaliação registrada ainda"
              description="As notas de qualidade de código e comunicação aparecerão aqui assim que o profissional concluir sua primeira entrega em Garantia."
              className="py-6"
            />
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {specialistReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 font-mono tabular-nums">
                    <span className="font-sans font-bold text-[var(--text-primary)]">
                      {rev.reviewerName}
                    </span>
                    <span className="text-amber-500 font-bold">
                      {rev.rating.toFixed(1)} ★ · Código {rev.codeQualityScore.toFixed(1)}{' '}
                      · Com. {rev.communicationScore.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Fechar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Briefcase className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onInviteToProject(specialist);
            }}
          >
            Convidar para Projeto
          </Button>
        </div>
      </div>
    </Modal>
  );
};
