import React, { useState } from 'react';
import { Award, Check, Star } from 'lucide-react';
import { AuthGatePanel } from '../../../components/AuthGatePanel';
import { INPUT_BASE_CLASS, validateReviewInput } from '../../../lib';
import type { ActiveUserProfileData, AppProject, AppReview } from '../../../types/domain';
import type { SubmitReviewPayload } from '../types';

export interface EscrowViewProps {
  currentUser: ActiveUserProfileData | null;
  selectedProject: AppProject | null;
  currentReviews: AppReview[];
  allReviews: AppReview[];
  requireVerifiedAuth: () => boolean;
  onReleaseEscrow: () => Promise<void>;
  onSubmitReview: (
    project: AppProject,
    user: ActiveUserProfileData,
    payload: SubmitReviewPayload
  ) => Promise<string>;
  onGoToMarketplace: () => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}

export const EscrowView: React.FC<EscrowViewProps> = ({
  currentUser,
  selectedProject,
  currentReviews,
  allReviews,
  requireVerifiedAuth,
  onReleaseEscrow,
  onSubmitReview,
  onGoToMarketplace,
  onFeedback,
}) => {
  const [revRating, setRevRating] = useState<number>(5);
  const [revCodeScore, setRevCodeScore] = useState<number>(5);
  const [revCommScore, setRevCommScore] = useState<number>(5);
  const [revComment, setRevComment] = useState<string>('');

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <AuthGatePanel
          initialMode="login"
          title="Entre para gerenciar Garantia & Pagamentos"
          subtitle="A custódia de valores e avaliações verificadas exigem uma conta autenticada."
          onSuccess={(msg) => onFeedback({ type: 'success', text: msg })}
        />
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Nenhum projeto selecionado para Custódia (Escrow)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Publique ou selecione um projeto no Marketplace para gerenciar depósitos e
          liberações em garantia.
        </p>
        <button
          type="button"
          onClick={onGoToMarketplace}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
        >
          Ir para o Marketplace
        </button>
      </div>
    );
  }

  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireVerifiedAuth()) return;

    if (selectedProject.status !== 'completed') {
      onFeedback({
        type: 'error',
        text: 'As avaliações verificadas são liberadas após a conclusão e liberação da garantia do projeto.',
      });
      return;
    }

    const validation = validateReviewInput({ comment: revComment });
    if (validation.ok === false) {
      onFeedback({ type: 'error', text: validation.error });
      return;
    }

    await onSubmitReview(selectedProject, currentUser, {
      rating: revRating,
      codeQualityScore: revCodeScore,
      communicationScore: revCommScore,
      comment: validation.data.comment,
    });

    setRevComment('');
    onFeedback({
      type: 'success',
      text: 'Avaliação verificada publicada no Firestore!',
    });
  };

  const reviewsToShow = currentReviews.length > 0 ? currentReviews : allReviews;

  return (
    <div className="space-y-5">
      {/* Escrow Unified Summary Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[var(--primary)]">
            Programa de Pagamento Seguro (Garantia 100%)
          </span>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Custódia Financeira &amp; Avaliação Mútua
          </h1>
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
            <Award className="w-4 h-4" />
            <span>
              Taxa 0% para clientes e especialistas · Projeto: {selectedProject.title}
            </span>
          </div>
        </div>

        <div className="pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] lg:pl-8 flex flex-col lg:items-end gap-1 shrink-0">
          <span className="text-xs text-[var(--text-muted)]">
            Valor Protegido em Garantia
          </span>
          <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            R${' '}
            {selectedProject.budget.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Status:{' '}
            {selectedProject.escrowStatus === 'funded'
              ? 'Fundos Protegidos em Custódia'
              : selectedProject.escrowStatus === 'released'
                ? 'Pagamento Liberado ao Especialista'
                : selectedProject.escrowStatus === 'refunded'
                  ? 'Garantia Reembolsada ao Contratante'
                  : 'Aguardando Contratação'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Devana Escrow Step-by-Step Timeline */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between gap-6">
          <div>
            <span className="text-xs text-[var(--text-muted)]">Projeto Ativo</span>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
              {selectedProject.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {[
              {
                step: '01',
                title: 'Contratação',
                desc: 'Proposta aprovada e escopo registrado.',
                active: selectedProject.escrowStatus === 'unfunded',
                done:
                  selectedProject.escrowStatus === 'funded' ||
                  selectedProject.escrowStatus === 'released',
              },
              {
                step: '02',
                title: 'Garantia Retida',
                desc: 'O cliente deposita o valor e o dev inicia os commits.',
                active: selectedProject.escrowStatus === 'funded',
                done: selectedProject.escrowStatus === 'released',
              },
              {
                step: '03',
                title: '100% Liberado',
                desc: 'Entrega aprovada e repasse integral ao profissional.',
                active: selectedProject.escrowStatus === 'released',
                done: selectedProject.escrowStatus === 'released',
              },
            ].map((s) => (
              <div
                key={s.step}
                className={`p-4 rounded-xl border ${
                  s.active
                    ? 'border-indigo-600 bg-[var(--primary-subtle)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-[var(--primary)] font-bold">
                  <span>PASSO {s.step}</span>
                  {s.done && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <p className="font-bold text-[var(--text-primary)] mt-1">{s.title}</p>
                <p className="text-[var(--text-muted)] mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-[var(--text-secondary)]">
              Repasse integral garantido (0% taxa da plataforma).
            </div>

            {selectedProject.status === 'in_progress' &&
              currentUser.uid === selectedProject.ownerId && (
                <button
                  type="button"
                  onClick={onReleaseEscrow}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
                >
                  Aprovar Entrega &amp; Liberar R${' '}
                  {selectedProject.budget.toLocaleString('pt-BR')}
                </button>
              )}
          </div>
        </div>

        {/* Right Column: Devana Mutual Rating */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Avaliação e Feedback Pós-Conclusão
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Qualifique o trabalho entregue para atualizar o ranking do profissional na
              plataforma.
            </p>
          </div>

          <form onSubmit={handleReviewFormSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Nota Geral
                </label>
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}.0 ★
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Qualidade Código
                </label>
                <select
                  value={revCodeScore}
                  onChange={(e) => setRevCodeScore(Number(e.target.value))}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}.0 / 5
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Comunicação
                </label>
                <select
                  value={revCommScore}
                  onChange={(e) => setRevCommScore(Number(e.target.value))}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}.0 / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Comentário Público sobre o Serviço
              </label>
              <textarea
                rows={3}
                required
                minLength={5}
                maxLength={1000}
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder="Conte como foi a experiência técnica com o especialista..."
                className={INPUT_BASE_CLASS}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Star className="w-4 h-4" />
              <span>Publicar Avaliação Verificada</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Avaliações Recentes
            </h3>
            {reviewsToShow.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                Nenhuma avaliação verificada registrada ainda. Publique a primeira
                avaliação após a conclusão de um projeto.
              </p>
            ) : (
              reviewsToShow.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-mono tabular-nums">
                    <span className="font-sans font-bold text-slate-900 dark:text-white">
                      {rev.reviewerName}
                    </span>
                    <span className="text-amber-500 font-bold">
                      {rev.rating.toFixed(1)} ★ · Código {rev.codeQualityScore.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
