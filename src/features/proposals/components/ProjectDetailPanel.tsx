import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge, Button, EmptyState } from '../../../components/ui';
import { ProjectDetailSkeleton } from '../../../components/ProjectCardSkeleton';
import { INPUT_BASE_CLASS } from '../../../lib';
import type {
  ActiveUserProfileData,
  AppBid,
  AppChatMessage,
  AppProject,
} from '../../../types/domain';
import { useProposalForm } from '../hooks/useProposalForm';
import type { DetailPanelTab, SubmitBidPayload } from '../types';

export interface ProjectDetailPanelProps {
  selectedProject: AppProject | null;
  currentUser: ActiveUserProfileData | null;
  bids: AppBid[];
  messages: AppChatMessage[];
  isSyncing: boolean;
  activeTab: DetailPanelTab;
  onTabChange: (tab: DetailPanelTab) => void;
  requireVerifiedAuth: () => boolean;
  onSubmitBid: (
    project: AppProject,
    user: ActiveUserProfileData,
    payload: SubmitBidPayload
  ) => Promise<string>;
  onAcceptBid: (bid: AppBid) => void;
  onOpenAuthModal: () => void;
  onOpenWorkspace: () => void;
  onOpenEscrow: () => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
  onBidSuccessNotify: (projectTitle: string, amount: number) => void;
  onBidErrorToast: () => void;
}

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({
  selectedProject,
  currentUser,
  bids,
  messages,
  isSyncing,
  activeTab,
  onTabChange,
  requireVerifiedAuth,
  onSubmitBid,
  onAcceptBid,
  onOpenAuthModal,
  onOpenWorkspace,
  onOpenEscrow,
  onFeedback,
  onBidSuccessNotify,
  onBidErrorToast,
}) => {
  const {
    bidAmount,
    setBidAmount,
    bidDays,
    setBidDays,
    bidPitch,
    setBidPitch,
    bidSubmitting,
    handleSubmit,
  } = useProposalForm({
    selectedProject,
    currentUser,
    requireVerifiedAuth,
    onSubmitBid,
    onFeedback,
    onSuccessNotify: onBidSuccessNotify,
    onErrorToast: onBidErrorToast,
  });

  if (isSyncing) {
    return <ProjectDetailSkeleton />;
  }

  if (!selectedProject) {
    return null;
  }

  return (
    <div className="xl:col-span-5 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xs sticky top-20">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-indigo-600 dark:text-sky-400">
            Detalhe do Projeto &amp; Garantia
          </span>
          <Badge
            tone={
              selectedProject.status === 'completed'
                ? 'success'
                : selectedProject.status === 'in_progress'
                  ? 'info'
                  : 'primary'
            }
          >
            {selectedProject.status === 'open'
              ? 'Aberto'
              : selectedProject.status === 'in_progress'
                ? 'Em Execução'
                : 'Concluído'}
          </Badge>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
          {selectedProject.title}
        </h3>
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-500">Valor líquido ao profissional (0% taxa):</span>
          <span className="font-mono tabular-nums font-bold text-base text-emerald-600 dark:text-emerald-400">
            R$ {selectedProject.budget.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Escrow Custody Timeline */}
      <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
          <span>Timeline de Garantia (Escrow)</span>
          <span className="font-mono text-[var(--primary)]">
            {selectedProject.escrowStatus === 'released'
              ? '3/3 Liberado'
              : selectedProject.escrowStatus === 'funded'
                ? '2/3 Retido'
                : '1/3 Aberto'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          {[
            {
              label: '01. Acordo',
              active: true,
              done:
                selectedProject.escrowStatus === 'funded' ||
                selectedProject.escrowStatus === 'released',
            },
            {
              label: '02. Retido',
              active:
                selectedProject.escrowStatus === 'funded' ||
                selectedProject.escrowStatus === 'released',
              done: selectedProject.escrowStatus === 'released',
            },
            {
              label: '03. Liberado',
              active: selectedProject.escrowStatus === 'released',
              done: selectedProject.escrowStatus === 'released',
            },
          ].map((step) => (
            <div
              key={step.label}
              className={`px-2.5 py-1.5 rounded-[var(--radius-md)] border text-center font-medium ${
                step.done
                  ? 'bg-[var(--success-subtle)] border-[var(--success-border)] text-[var(--success)]'
                  : step.active
                    ? 'bg-[var(--primary-subtle)] border-[var(--primary-border)] text-[var(--primary)] font-semibold'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Tabs: Proposals vs Quick Chat Preview */}
      <div
        role="tablist"
        aria-label="Seções do detalhe do projeto"
        className="grid grid-cols-2 gap-1.5 p-1 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'proposals'}
          onClick={() => onTabChange('proposals')}
          className={`py-2 px-3 rounded-[var(--radius-sm)] font-semibold transition-colors cursor-pointer ${
            activeTab === 'proposals'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-2xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Propostas ({bids.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          onClick={() => onTabChange('chat')}
          className={`py-2 px-3 rounded-[var(--radius-sm)] font-semibold transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-2xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Chat &amp; Diário ({messages.length})
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="space-y-4 text-xs">
          {messages.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-5 h-5" />}
              title="Nenhuma mensagem nesta sala"
              description="Abra o Workspace completo para enviar mensagens em tempo real e sincronizar commits do GitHub."
              actionLabel="Abrir Diário & Chat Completo"
              onAction={onOpenWorkspace}
              className="py-6"
            />
          ) : (
            <>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {messages.slice(-4).map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[var(--text-primary)]">
                        {msg.senderName}
                      </span>
                      <span className="text-[var(--text-muted)] font-mono">
                        {new Date(msg.createdAtIso).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={onOpenWorkspace}
              >
                Abrir Chat &amp; Diário Completo
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Proposals List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Propostas Recebidas ({bids.length})
            </h4>

            {bids.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                Seja o primeiro especialista a enviar uma proposta para este projeto!
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {bids.map((bid) => (
                  <div
                    key={bid.id}
                    className="p-4 space-y-2 text-xs bg-slate-50/60 dark:bg-slate-900/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {bid.freelancerName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {bid.freelancerSpecialty}
                        </span>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <span className="font-bold text-indigo-700 dark:text-sky-400 block">
                          R$ {bid.amount.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          em {bid.deliveryDays} dias
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {bid.pitch}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        Status:{' '}
                        <strong
                          className={
                            bid.status === 'accepted'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : bid.status === 'rejected'
                                ? 'text-slate-400'
                                : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {bid.status === 'accepted'
                            ? 'Proposta Aceita (Garantia Ativa)'
                            : bid.status === 'rejected'
                              ? 'Recusada'
                              : 'Em avaliação'}
                        </strong>
                      </span>

                      {selectedProject.status === 'open' &&
                        bid.status === 'pending' &&
                        currentUser?.uid === selectedProject.ownerId && (
                          <button
                            type="button"
                            onClick={() => onAcceptBid(bid)}
                            className="px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Contratar &amp; Depositar Garantia
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Proposal Form */}
          {selectedProject.status === 'open' ? (
            !currentUser ? (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-300">
                  Faça login ou crie sua conta para enviar uma proposta técnica neste
                  projeto.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={onOpenAuthModal}
                >
                  Entrar / Criar Conta para Enviar Proposta
                </Button>
              </div>
            ) : selectedProject.ownerId === currentUser.uid ? (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Você é o contratante deste projeto. Analise as propostas recebidas acima
                para iniciar o contrato em Garantia.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800"
              >
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Faça sua Proposta (Você recebe 100% do valor)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Valor da Proposta (R$)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={10000000}
                      required
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={String(selectedProject.budget)}
                      className={`${INPUT_BASE_CLASS} font-mono tabular-nums`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Prazo de Entrega (Dias)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      required
                      value={bidDays}
                      onChange={(e) => setBidDays(e.target.value)}
                      placeholder={String(selectedProject.deadlineDays)}
                      className={`${INPUT_BASE_CLASS} font-mono tabular-nums`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Detalhes Técnicos da Proposta
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    maxLength={1500}
                    value={bidPitch}
                    onChange={(e) => setBidPitch(e.target.value)}
                    placeholder="Explique sua experiência com a stack, arquitetura sugerida e entregas..."
                    className={INPUT_BASE_CLASS}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={bidSubmitting}
                >
                  Enviar Proposta como {currentUser.displayName}
                </Button>
              </form>
            )
          ) : (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="flex-1"
                onClick={onOpenWorkspace}
              >
                Abrir Diário de Trabalho &amp; Chat
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={onOpenEscrow}>
                Ver Garantia
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
