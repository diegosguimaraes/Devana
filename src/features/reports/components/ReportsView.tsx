import React, { useState } from 'react';
import { CloudUpload, Download, FileText, Lock, Mail } from 'lucide-react';
import { INPUT_BASE_CLASS } from '../../../lib';
import type {
  ActiveUserProfileData,
  AppBid,
  AppProject,
  AppReview,
  AppWorklog,
} from '../../../types/domain';
import { exportMetricsToCsv, exportMetricsToPdf } from '../../../utils/exportReports';
import { useReportsBackup } from '../hooks/useReportsBackup';

export interface ReportsViewProps {
  currentUser: ActiveUserProfileData | null;
  userEmail: string | null;
  projects: AppProject[];
  selectedProject: AppProject | null;
  bidsByProject: Record<string, AppBid[]>;
  worklogsByProject: Record<string, AppWorklog[]>;
  reviewsByProject: Record<string, AppReview[]>;
  allWorklogs: AppWorklog[];
  metricsSummary: {
    totalEscrowBrl: number;
    totalHours: number;
    totalCommits: number;
    averageRating: number;
  };
  backupPassphrase: string;
  onBackupPassphraseChange: (val: string) => void;
  requireVerifiedAuth: () => boolean;
  onOpenAuthModal: () => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  userEmail,
  projects,
  selectedProject,
  bidsByProject,
  worklogsByProject,
  reviewsByProject,
  allWorklogs,
  metricsSummary,
  backupPassphrase,
  onBackupPassphraseChange,
  requireVerifiedAuth,
  onOpenAuthModal,
  onFeedback,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const {
    shareEmailInput,
    setShareEmailInput,
    shareStatusMsg,
    reportChecksum,
    lastEncryptedBackup,
    handleShareReportByEmail,
    handleEncryptedCloudBackup,
  } = useReportsBackup({
    projects,
    bidsByProject,
    worklogsByProject,
    reviewsByProject,
    allWorklogs,
    selectedProject,
    currentUser,
    userEmail,
    metricsSummary,
    backupPassphrase,
    requireVerifiedAuth,
    onFeedback,
  });

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportMetricsToPdf(
        projects,
        allWorklogs.map((w) => ({
          ...w,
          projectTitle: projects.find((p) => p.id === w.projectId)?.title || w.projectId,
        })),
        {
          ...metricsSummary,
          checksumSha256: reportChecksum,
        }
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Reports Page Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Relatórios de Desempenho &amp; Backup
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Exporte métricas auditadas em PDF/CSV, compartilhe por e-mail ou gere backups
            AES-256-GCM.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={() => void handleDownloadPdf()}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{isExportingPdf ? 'Gerando PDF...' : 'Baixar Relatório PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              exportMetricsToCsv(
                projects,
                allWorklogs.map((w) => ({
                  ...w,
                  projectTitle:
                    projects.find((p) => p.id === w.projectId)?.title || w.projectId,
                }))
              )
            }
            className="px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-subtle)] hover:bg-[var(--border)] rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Planilha CSV</span>
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-1">
          <dt className="text-xs text-[var(--text-muted)]">Em Custódia</dt>
          <dd className="font-mono tabular-nums text-xl font-bold text-[var(--text-primary)]">
            R$ {metricsSummary.totalEscrowBrl.toLocaleString('pt-BR')}
          </dd>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            0% Taxa
          </span>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-1">
          <dt className="text-xs text-[var(--text-muted)]">Horas Auditadas</dt>
          <dd className="font-mono tabular-nums text-xl font-bold text-[var(--primary)]">
            {metricsSummary.totalHours.toFixed(1)} h
          </dd>
          <span className="text-[11px] text-[var(--text-muted)]">Diário Git</span>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-1">
          <dt className="text-xs text-[var(--text-muted)]">Commits Totais</dt>
          <dd className="font-mono tabular-nums text-xl font-bold text-[var(--text-primary)]">
            {metricsSummary.totalCommits}
          </dd>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {projects.length} projetos
          </span>
        </div>
      </dl>

      {!currentUser && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-amber-900 dark:text-amber-200">
            Entre na sua conta verificada para disparar relatórios por e-mail e
            sincronizar backups criptografados na nuvem.
          </span>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-3.5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
          >
            Entrar ou Criar Conta
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-6 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-7 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
              <span>Compartilhamento Seguro de Relatórios por E-mail</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Envia o resumo de horas, commits e garantia validado com hash SHA-256.
            </p>

            <form onSubmit={handleShareReportByEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  E-mail do Destinatário
                </label>
                <input
                  type="email"
                  required
                  value={shareEmailInput}
                  onChange={(e) => setShareEmailInput(e.target.value)}
                  className={INPUT_BASE_CLASS}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 truncate">
                SHA-256: {reportChecksum}
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Enviar Relatório Validado</span>
              </button>
            </form>
          </div>

          {shareStatusMsg && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {shareStatusMsg}
            </p>
          )}
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-7 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
              <span>Backup Criptografado AES-256-GCM para Nuvem</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Criptografa todos os registros localmente (PBKDF2 + AES-256-GCM) antes de
              enviar ao servidor de backup e baixar o arquivo{' '}
              <code className="font-mono">.devana.enc</code>.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Chave Secreta de Criptografia
                </label>
                <input
                  type="text"
                  value={backupPassphrase}
                  onChange={(e) => onBackupPassphraseChange(e.target.value)}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                />
              </div>

              <button
                type="button"
                onClick={handleEncryptedCloudBackup}
                className="px-4 py-2.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Exportar &amp; Sincronizar Backup (.devana.enc)</span>
              </button>
            </div>
          </div>

          {lastEncryptedBackup && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1 font-mono text-[11px]">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                Backup {lastEncryptedBackup.backupId} ({lastEncryptedBackup.recordCount}{' '}
                registros)
              </div>
              <div className="text-slate-500 truncate">
                Token: {lastEncryptedBackup.combinedToken.slice(0, 68)}...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
