import React, { useState, useEffect, useId } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Briefcase,
  Code2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { UserRoleType } from '../types/domain';
import { Badge, Button } from './ui';

export interface PendingProfileDraft {
  displayName: string;
  roleType: UserRoleType;
  specialty: string;
  hourlyRate: number;
  githubUsername: string;
}

interface AuthGatePanelProps {
  initialMode?: 'login' | 'register';
  initialRole?: UserRoleType;
  title?: string;
  subtitle?: string;
  onSuccess?: (message: string) => void;
}

function mapFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos. Verifique seus dados e tente novamente.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado na Devana. Faça login na aba "Entrar".';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Utilize pelo menos 8 caracteres com letras e números.';
    case 'auth/invalid-email':
      return 'Informe um endereço de e-mail válido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em sequência. Aguarde alguns minutos antes de tentar novamente.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login com Google foi fechada antes da conclusão.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o pop-up do Google. Autorize pop-ups para este site ou entre com e-mail e senha.';
    case 'auth/operation-not-allowed':
      return 'O login por E-mail/Senha ainda não foi habilitado no Firebase Console deste projeto. Utilize "Continuar com Google" ou ative E-mail/Senha no console Firebase.';
    default:
      return err instanceof Error && err.message
        ? err.message
        : 'Não foi possível concluir a autenticação. Tente novamente.';
  }
}

export const AuthGatePanel: React.FC<AuthGatePanelProps> = ({
  initialMode = 'login',
  initialRole = 'freelancer',
  title = 'Acesse sua conta Devana',
  subtitle = 'Autenticação real com Firebase Auth. Entre ou crie sua conta gratuita de Cliente ou Profissional.',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [roleType, setRoleType] = useState<UserRoleType>(initialRole);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hourlyRate, setHourlyRate] = useState('150');
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setRegisterStep(1);
    setErrorMsg(null);
  }, [initialMode]);

  useEffect(() => {
    setRoleType(initialRole);
  }, [initialRole]);

  const uid = useId();
  const inputClass =
    'w-full px-3.5 py-2.5 text-xs bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-colors';

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      try {
        sessionStorage.setItem('devana_pending_google_role', roleType);
      } catch {
        // Ignore storage error
      }
      await signInWithPopup(auth, googleProvider);
      onSuccess?.('Login realizado com sucesso via Google!');
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg(
        'Digite seu e-mail no campo acima para receber o link de redefinição de senha.'
      );
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setInfoMsg(
        `Link de redefinição de senha enviado para ${cleanEmail}. Verifique sua caixa de entrada e spam.`
      );
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNextRegisterStep = () => {
    setErrorMsg(null);
    const cleanName = displayName.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      setErrorMsg('Informe seu nome completo ou nome da empresa (mínimo 2 caracteres).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('A senha deve conter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não conferem.');
      return;
    }
    setRegisterStep(2);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Informe seu endereço de e-mail.');
      return;
    }

    if (mode === 'login') {
      if (password.length < 6) {
        setErrorMsg('Informe sua senha.');
        return;
      }
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        onSuccess?.('Sessão iniciada com sucesso!');
      } catch (err) {
        setErrorMsg(mapFirebaseAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Guided Step 1 validation fallback if submitted via Enter
    if (registerStep === 1) {
      handleNextRegisterStep();
      return;
    }

    const cleanName = displayName.trim();
    const cleanSpecialty =
      specialty.trim() ||
      (roleType === 'client'
        ? 'Cliente · Tecnologia & Produto Digital'
        : 'Engenharia de Software Full-Stack');

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, {
        displayName: cleanName.slice(0, 80),
      });

      const draft: PendingProfileDraft = {
        displayName: cleanName.slice(0, 80),
        roleType,
        specialty: cleanSpecialty.slice(0, 100),
        hourlyRate:
          roleType === 'client'
            ? 0
            : Math.max(20, Math.min(5000, Number(hourlyRate) || 150)),
        githubUsername: githubUsername.trim().replace(/^@/, '').slice(0, 60),
      };
      try {
        localStorage.setItem(
          `devana_pending_profile_${cred.user.uid}`,
          JSON.stringify(draft)
        );
      } catch {
        // Ignore storage error
      }

      try {
        await sendEmailVerification(cred.user);
      } catch {
        // User can resend verification from dashboard
      }

      onSuccess?.(
        `Conta criada para ${cleanName}! Enviamos um e-mail de confirmação para ${cleanEmail}.`
      );
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Autenticação Segura · Devana</span>
        </div>
        <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{subtitle}</p>
      </div>

      {/* Mode Switcher Tabs: Login vs Register */}
      <div
        role="tablist"
        aria-label="Modo de acesso"
        className="grid grid-cols-2 p-1 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => {
            setMode('login');
            setRegisterStep(1);
            setErrorMsg(null);
            setInfoMsg(null);
          }}
          className={`py-2 px-3 rounded-[var(--radius-md)] font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Entrar</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          onClick={() => {
            setMode('register');
            setRegisterStep(1);
            setErrorMsg(null);
            setInfoMsg(null);
          }}
          className={`py-2 px-3 rounded-[var(--radius-md)] font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'register'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Criar Conta</span>
        </button>
      </div>

      {/* Guided Onboarding Step Progress (Register Mode) */}
      {mode === 'register' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="text-[var(--primary)] font-semibold">
              {registerStep === 1
                ? 'Etapa 1 de 2 · Perfil e Credenciais'
                : 'Etapa 2 de 2 · Especialidade e Portfólio'}
            </span>
            <span className="font-mono text-[var(--text-muted)]">
              {registerStep === 1 ? '50%' : '100%'}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progresso do cadastro"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={registerStep === 1 ? 50 : 100}
            className="h-1.5 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden"
          >
            <div
              className="h-full bg-[var(--primary)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]"
              style={{ width: registerStep === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3 rounded-[var(--radius-lg)] border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-xs text-red-800 dark:text-red-200 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div
          role="status"
          className="p-3 rounded-[var(--radius-lg)] border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Google Auth (Step 1 or Login) */}
      {(mode === 'login' || registerStep === 1) && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#2D1B4E] hover:bg-[#3B2063] disabled:opacity-60 rounded-[var(--radius-lg)] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LogIn className="w-4 h-4 text-sky-400" />
            <span>
              {mode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google (1 Clique)'}
            </span>
          </button>

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[var(--border)]" />
            <span className="shrink mx-3 text-[11px] text-[var(--text-muted)] font-medium">
              ou utilize e-mail e senha
            </span>
            <div className="flex-grow border-t border-[var(--border)]" />
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-xs">
        {mode === 'login' && (
          <>
            <div>
              <label
                htmlFor={`${uid}-login-email`}
                className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id={`${uid}-login-email`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor={`${uid}-login-password`}
                  className="block text-[11px] font-semibold text-[var(--text-secondary)]"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[11px] font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" aria-hidden="true" />
                  <span>Esqueci minha senha</span>
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id={`${uid}-login-password`}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Entrar na Devana
            </Button>
          </>
        )}

        {mode === 'register' && registerStep === 1 && (
          <>
            <div
              role="group"
              aria-label="Escolha o tipo de perfil"
              className="grid grid-cols-2 gap-3"
            >
              <button
                type="button"
                aria-pressed={roleType === 'freelancer'}
                onClick={() => setRoleType('freelancer')}
                className={`p-3 rounded-[var(--radius-lg)] border-2 text-left transition-all cursor-pointer ${
                  roleType === 'freelancer'
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                  <Code2
                    className="w-3.5 h-3.5 text-[var(--primary)]"
                    aria-hidden="true"
                  />
                  <span>Profissional</span>
                </span>
                <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">
                  Enviar propostas e atuar em projetos
                </span>
              </button>

              <button
                type="button"
                aria-pressed={roleType === 'client'}
                onClick={() => setRoleType('client')}
                className={`p-3 rounded-[var(--radius-lg)] border-2 text-left transition-all cursor-pointer ${
                  roleType === 'client'
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                  <Briefcase
                    className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>Cliente</span>
                </span>
                <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">
                  Publicar projetos e contratar devs
                </span>
              </button>
            </div>

            <div>
              <label
                htmlFor={`${uid}-reg-name`}
                className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
              >
                {roleType === 'freelancer' ? 'Nome Completo' : 'Seu Nome ou Empresa'}
              </label>
              <input
                id={`${uid}-reg-name`}
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={
                  roleType === 'freelancer'
                    ? 'Ex: Seu nome profissional'
                    : 'Ex: Nome da sua empresa'
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor={`${uid}-reg-email`}
                className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id={`${uid}-reg-email`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`${uid}-reg-pass`}
                  className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Senha (mín. 8 caracteres)
                </label>
                <div className="relative">
                  <Lock
                    className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id={`${uid}-reg-pass`}
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${uid}-reg-confirm`}
                  className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock
                    className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id={`${uid}-reg-confirm`}
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleNextRegisterStep}
              className="w-full"
            >
              Continuar para Etapa 2
            </Button>
          </>
        )}

        {mode === 'register' && registerStep === 2 && (
          <>
            <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-[var(--text-primary)] block truncate">
                  {displayName}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] truncate block">
                  {email}
                </span>
              </div>
              <Badge tone={roleType === 'freelancer' ? 'primary' : 'success'}>
                {roleType === 'freelancer' ? 'Profissional' : 'Cliente'}
              </Badge>
            </div>

            <div>
              <label
                htmlFor={`${uid}-reg-specialty`}
                className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
              >
                {roleType === 'freelancer'
                  ? 'Especialidade Principal'
                  : 'Área de Atuação'}
              </label>
              <input
                id={`${uid}-reg-specialty`}
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={
                  roleType === 'freelancer'
                    ? 'Ex: React, Node.js & Cloud AWS'
                    : 'Ex: SaaS, Fintech, E-commerce'
                }
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleType === 'freelancer' && (
                <div>
                  <label
                    htmlFor={`${uid}-reg-rate`}
                    className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Valor/Hora Sugerido (R$/h)
                  </label>
                  <input
                    id={`${uid}-reg-rate`}
                    type="number"
                    min={20}
                    max={5000}
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className={`${inputClass} font-mono tabular-nums`}
                  />
                </div>
              )}

              <div className={roleType === 'client' ? 'sm:col-span-2' : ''}>
                <label
                  htmlFor={`${uid}-reg-github`}
                  className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1"
                >
                  GitHub (Opcional)
                </label>
                <input
                  id={`${uid}-reg-github`}
                  type="text"
                  maxLength={60}
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="usuario-ou-org"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => {
                  setErrorMsg(null);
                  setRegisterStep(1);
                }}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {roleType === 'freelancer'
                  ? 'Concluir Conta de Profissional'
                  : 'Concluir Conta de Cliente'}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};
