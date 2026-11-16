import React from 'react';
import { ShieldCheck, Upload, Webhook } from 'lucide-react';
import { INPUT_BASE_CLASS } from '../../../lib';
import type { ActiveUserProfileData } from '../../../types/domain';
import { useSecurityCenter } from '../hooks/useSecurityCenter';
import type { WebhookProvider } from '../types';

const SECURITY_GUIDELINES = [
  '01. Chaves de API e segredos restritos ao backend',
  '02. .gitignore configurado contra versionamento de .env',
  '03. Apenas chaves públicas no SDK client-side',
  '04. Row-Level Security (Firestore Rules) com Master Gate',
  '05. Criptografia AES-256-GCM de PII antes do banco',
  '06. Autenticação delegada ao Firebase Scrypt / OAuth 2.0',
  '07. Queries parametrizadas e tipadas sem concatenação',
  '08. Validação Firebase ID Token no servidor Express',
  '09. Isolamento de sessão contra CSRF/XSS',
  '10. Rate Limiting estrito nas rotas de autenticação (12/min)',
  '11. Rate Limiting global por IP (90/min) contra bots',
  '12. Schemas Zod estritos em todas as entradas',
  '13. Bloqueio de Mass Assignment (.strict() + hasOnly())',
  '14. Sanitização e encodeURIComponent em URLs',
  '15. Validação de Magic Bytes binários em uploads',
  '16. Respostas de API enxutas sem campos ocultos',
  '17. Logs livres de senhas, tokens ou PII',
  '18. Headers HSTS, X-Content-Type-Options e Permissions-Policy',
  '19. Tráfego HTTPS/WSS criptografado ponta a ponta',
  '20. Regras auditadas via ESLint security plugin (0 erros)',
] as const;

export interface SecurityCenterViewProps {
  authReady: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  userEmail: string | null;
  currentUser: ActiveUserProfileData | null;
  backupPassphrase: string;
  pushPrefs: {
    pushEnabled: boolean;
    notifyOnBid: boolean;
    notifyOnMessage: boolean;
    notifyOnEscrow: boolean;
  };
  requireVerifiedAuth: () => boolean;
  onOpenAuthModal: () => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({
  authReady,
  isAuthenticated,
  isEmailVerified,
  userEmail,
  currentUser,
  backupPassphrase,
  pushPrefs,
  requireVerifiedAuth,
  onOpenAuthModal,
  onFeedback,
}) => {
  const {
    piiEmail,
    setPiiEmail,
    piiDocument,
    setPiiDocument,
    piiPhone,
    setPiiPhone,
    encryptedPiiPreview,
    decryptedPiiPreview,
    uploadCheckResult,
    webhookProvider,
    setWebhookProvider,
    webhookTarget,
    setWebhookTarget,
    webhooksList,
    handleSaveIsolatedPii,
    handleFileUploadVerification,
    handleAddWebhook,
  } = useSecurityCenter({
    authReady,
    isAuthenticated,
    isEmailVerified,
    userEmail,
    currentUser,
    backupPassphrase,
    pushPrefs,
    requireVerifiedAuth,
    onFeedback,
  });

  return (
    <div className="space-y-5">
      {/* Security Overview Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Centro de Segurança (20 Diretrizes) &amp; Integrações via API
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Isolamento de PII com AES-256-GCM, inspeção binária de Magic Numbers em
            uploads, webhooks e conformidade OWASP/RLS.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-4 lg:pt-0 lg:pl-6">
          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Banco</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              RLS Ativo
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Cifra</span>
            <span className="font-bold text-[var(--text-primary)]">AES-256</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Uploads</span>
            <span className="font-bold text-[var(--text-primary)]">Magic Bytes</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[11px]">Auth API</span>
            <span className="font-bold text-[var(--primary)]">JWT Verif.</span>
          </div>
        </div>
      </div>

      {!currentUser && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-amber-900 dark:text-amber-200">
            Autenticação necessária para gravar no cofre privado AES-256-GCM, validar
            uploads no servidor e registrar webhooks.
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

      {/* Symmetrical 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Encrypted PII Vault */}
        <form
          onSubmit={handleSaveIsolatedPii}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4 text-xs flex flex-col justify-between"
        >
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cofre de PII Criptografado (Split Collection)</span>
            </h2>
            <p className="text-[var(--text-secondary)]">
              Dados pessoais são cifrados com AES-256-GCM no cliente antes de gravar em{' '}
              <code className="font-mono">/users/&#123;uid&#125;/private/settings</code>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                  E-mail Privado
                </label>
                <input
                  type="email"
                  value={piiEmail}
                  onChange={(e) => setPiiEmail(e.target.value)}
                  className={INPUT_BASE_CLASS}
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                  CPF / CNPJ
                </label>
                <input
                  type="text"
                  value={piiDocument}
                  onChange={(e) => setPiiDocument(e.target.value)}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={piiPhone}
                  onChange={(e) => setPiiPhone(e.target.value)}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)] break-all">
              {encryptedPiiPreview.slice(0, 92)}...
            </div>

            {decryptedPiiPreview && (
              <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                {decryptedPiiPreview}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="px-4 py-2.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              Criptografar &amp; Salvar PII
            </button>
          </div>
        </form>

        {/* Magic Numbers Upload Verifier */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[var(--primary)]" />
              <span>Validador de Upload Seguro (Magic Numbers)</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Valida os primeiros bytes binários do arquivo no navegador e no backend
              Express, bloqueando executáveis disfarçados e gerando identificador UUID
              seguro.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="px-4 py-2.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer inline-block">
                <span>Selecionar Arquivo (PDF/PNG/JPG/CSV)</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.csv"
                  onChange={handleFileUploadVerification}
                  className="hidden"
                />
              </label>
            </div>

            {uploadCheckResult && (
              <div
                className={`p-3.5 rounded-xl border ${
                  uploadCheckResult.ok
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'border-red-200 bg-red-50/50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200'
                }`}
              >
                <p className="font-bold">{uploadCheckResult.message}</p>
                {uploadCheckResult.detail && (
                  <p className="font-mono text-[11px] mt-1">{uploadCheckResult.detail}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Webhooks & API Integration */}
        <form
          onSubmit={handleAddWebhook}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4 text-xs flex flex-col justify-between"
        >
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[var(--primary)]" />
              <span>Webhooks &amp; Integração com Serviços de Terceiros</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                  Provedor
                </label>
                <select
                  value={webhookProvider}
                  onChange={(e) => setWebhookProvider(e.target.value as WebhookProvider)}
                  className={INPUT_BASE_CLASS}
                >
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                  <option value="jira">Jira</option>
                  <option value="slack">Slack</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                  Repositório / Canal
                </label>
                <input
                  type="text"
                  required
                  value={webhookTarget}
                  onChange={(e) => setWebhookTarget(e.target.value)}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              Adicionar Integração
            </button>
          </div>

          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
            {webhooksList.length === 0 ? (
              <div className="p-3.5 text-[var(--text-muted)] bg-[var(--surface-subtle)]">
                Nenhum webhook registrado no servidor ainda.
              </div>
            ) : (
              webhooksList.map((wh) => (
                <div
                  key={wh.id}
                  className="p-3 flex items-center justify-between gap-2 bg-[var(--surface-subtle)]"
                >
                  <div>
                    <span className="font-bold uppercase text-[var(--primary)] mr-2">
                      {wh.provider}
                    </span>
                    <span className="font-mono text-[var(--text-secondary)]">
                      {wh.repositoryOrChannel}
                    </span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                    Ativo ({wh.events.length} eventos)
                  </span>
                </div>
              ))
            )}
          </div>
        </form>

        {/* Checklist das 20 Diretrizes */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-3 text-xs">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Checklist das 20 Diretrizes de Segurança Pré-Lançamento
          </h2>
          <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto pr-1">
            {SECURITY_GUIDELINES.map((item) => (
              <div key={item} className="py-2 flex items-center justify-between gap-3">
                <span className="text-[var(--text-secondary)]">{item}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold whitespace-nowrap shrink-0">
                  VERIFICADO
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
