import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Code2,
  CheckCircle2,
  FolderGit2,
  Plus,
  GitCommit,
  ArrowRight,
  Save,
  UserCheck,
  Mail,
  RefreshCw,
  AlertCircle,
  Star,
  TrendingUp,
  Circle,
} from 'lucide-react';
import {
  AppProject,
  AppBid,
  AppWorklog,
  AppReview,
  ActiveUserProfileData,
  UserRoleType,
  GENERATED_ASSETS,
} from '../types/domain';
import { Avatar, Badge, Button } from './ui';

interface UserDashboardPanelProps {
  userProfile: ActiveUserProfileData;
  userEmail: string | null;
  projects: AppProject[];
  bidsByProject: Record<string, AppBid[]>;
  worklogsByProject: Record<string, AppWorklog[]>;
  reviews?: AppReview[];
  onSaveProfile: (updated: {
    displayName: string;
    roleType: UserRoleType;
    specialty: string;
    hourlyRate: number;
    githubUsername: string;
    bio: string;
    avatarUrl: string;
    isAvailableForHire: boolean;
  }) => Promise<void>;
  onResendVerificationEmail: () => Promise<void>;
  onRefreshVerificationStatus: () => Promise<void>;
  onOpenNewProjectModal: () => void;
  onSelectProjectAndNavigate: (
    projectId: string,
    section: 'marketplace' | 'workspace' | 'escrow'
  ) => void;
}

export const UserDashboardPanel: React.FC<UserDashboardPanelProps> = ({
  userProfile,
  userEmail,
  projects,
  bidsByProject,
  worklogsByProject,
  reviews = [],
  onSaveProfile,
  onResendVerificationEmail,
  onRefreshVerificationStatus,
  onOpenNewProjectModal,
  onSelectProjectAndNavigate,
}) => {
  const [roleType, setRoleType] = useState<UserRoleType>(userProfile.roleType);
  const [displayName, setDisplayName] = useState<string>(userProfile.displayName);
  const [specialty, setSpecialty] = useState<string>(userProfile.specialty);
  const [hourlyRate, setHourlyRate] = useState<string>(
    String(userProfile.hourlyRate || 150)
  );
  const [githubUsername, setGithubUsername] = useState<string>(
    userProfile.githubUsername || ''
  );
  const [bio, setBio] = useState<string>(userProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState<string>(userProfile.avatarUrl);
  const [isAvailable, setIsAvailable] = useState<boolean>(userProfile.isAvailableForHire);
  const [saving, setSaving] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    setRoleType(userProfile.roleType);
    setDisplayName(userProfile.displayName);
    setSpecialty(userProfile.specialty);
    setHourlyRate(String(userProfile.hourlyRate || 150));
    setGithubUsername(userProfile.githubUsername || '');
    setBio(userProfile.bio);
    setAvatarUrl(userProfile.avatarUrl);
    setIsAvailable(userProfile.isAvailableForHire);
  }, [userProfile]);

  const handleRoleSwitch = (nextRole: UserRoleType) => {
    setRoleType(nextRole);
    if (nextRole === 'client') {
      setIsAvailable(false);
      if (specialty.startsWith('Engenharia') || !specialty.trim()) {
        setSpecialty('Cliente · Empresa de Tecnologia & Produto Digital');
      }
      if (!bio.trim() || bio.includes('Especialista')) {
        setBio(
          'Contratante na Devana buscando especialistas para projetos de desenvolvimento, cloud e segurança com pagamento em Garantia.'
        );
      }
    } else {
      setIsAvailable(true);
      if (specialty.startsWith('Cliente') || !specialty.trim()) {
        setSpecialty('Engenharia de Software Full-Stack');
      }
      if (Number(hourlyRate) === 0) {
        setHourlyRate('150');
      }
      if (!bio.trim() || bio.includes('Contratante')) {
        setBio('Profissional de tecnologia disponível para projetos na Devana.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile({
        displayName: displayName.trim().slice(0, 80) || userProfile.displayName,
        roleType,
        specialty:
          specialty.trim().slice(0, 100) ||
          (roleType === 'client'
            ? 'Cliente · Tecnologia & Inovação'
            : 'Engenharia de Software Full-Stack'),
        hourlyRate:
          roleType === 'client'
            ? 0
            : Math.max(0, Math.min(100000, Number(hourlyRate) || 150)),
        githubUsername: githubUsername.trim().replace(/^@/, '').slice(0, 60),
        bio:
          bio.trim().slice(0, 600) ||
          (roleType === 'client'
            ? 'Perfil de cliente ativo na Devana.'
            : 'Especialista de tecnologia disponível para projetos na Devana.'),
        avatarUrl: avatarUrl.trim().slice(0, 500) || GENERATED_ASSETS.avatarEngineer1,
        isAvailableForHire: roleType === 'freelancer' ? isAvailable : false,
      });
    } finally {
      setSaving(false);
    }
  };

  const myClientProjects = projects.filter((p) => p.ownerId === userProfile.uid);
  const allBids = (Object.values(bidsByProject) as AppBid[][]).flat();
  const myFreelancerBids = allBids.filter((b) => b.freelancerId === userProfile.uid);
  const myAssignedProjects = projects.filter(
    (p) => p.assignedFreelancerId === userProfile.uid
  );
  const allWorklogs = (Object.values(worklogsByProject) as AppWorklog[][]).flat();
  const myWorklogs = allWorklogs.filter((w) => w.freelancerId === userProfile.uid);
  const myTotalHours = myWorklogs.reduce((acc, w) => acc + w.hours, 0);

  // Dashboard Metrics & Lightweight Chart Datasets
  const relevantProjects = roleType === 'client' ? myClientProjects : myAssignedProjects;
  const activeCount = relevantProjects.filter((p) => p.status === 'in_progress').length;
  const openCount = relevantProjects.filter((p) => p.status === 'open').length;
  const completedCount = relevantProjects.filter((p) => p.status === 'completed').length;

  const totalEscrowOrEarnings = relevantProjects
    .filter((p) => p.escrowStatus === 'funded' || p.escrowStatus === 'released')
    .reduce((acc, p) => acc + p.budget, 0);

  const myReviews = reviews.filter((r) => r.targetUserId === userProfile.uid);
  const avgRating =
    myReviews.length > 0
      ? myReviews.reduce((acc, r) => acc + r.rating, 0) / myReviews.length
      : userProfile.reputationScore || 0;

  // Lightweight 6-bar SVG chart series (hours per recent worklog or budget per recent project)
  const chartBars = useMemo(() => {
    if (roleType === 'freelancer' && myWorklogs.length > 0) {
      const slice = myWorklogs.slice(-6);
      const maxVal = Math.max(...slice.map((w) => w.hours), 1);
      return slice.map((w, idx) => ({
        label: `Log ${idx + 1}`,
        value: w.hours,
        display: `${w.hours}h`,
        pct: Math.max(12, Math.round((w.hours / maxVal) * 100)),
      }));
    }
    if (relevantProjects.length > 0) {
      const slice = relevantProjects.slice(0, 6);
      const maxBudget = Math.max(...slice.map((p) => p.budget), 1);
      return slice.map((p, idx) => ({
        label: p.title.slice(0, 8) || `P${idx + 1}`,
        value: p.budget,
        display: `R$${Math.round(p.budget / 1000)}k`,
        pct: Math.max(15, Math.round((p.budget / maxBudget) * 100)),
      }));
    }
    return [];
  }, [roleType, myWorklogs, relevantProjects]);

  const totalStatusCount = Math.max(openCount + activeCount + completedCount, 1);

  // Short Guided Onboarding Steps (Shown inside Dashboard Bento until completed)
  const onboardingSteps = [
    {
      id: 'verify',
      label: 'Confirmar e-mail da conta',
      done: userProfile.isVerifiedAuth,
      actionLabel: 'Verificar agora',
      onAction: () => {
        void onRefreshVerificationStatus();
      },
    },
    {
      id: 'github',
      label:
        roleType === 'freelancer'
          ? 'Conectar GitHub e especialidade'
          : 'Completar perfil da empresa',
      done:
        roleType === 'freelancer'
          ? Boolean(userProfile.githubUsername?.trim()) &&
            userProfile.bio.trim().length > 20
          : userProfile.bio.trim().length > 20,
      actionLabel: 'Preencher abaixo',
      onAction: () => {
        document.getElementById('dashboard-profile-form')?.scrollIntoView({
          behavior: 'smooth',
        });
      },
    },
    {
      id: 'first_action',
      label:
        roleType === 'client'
          ? 'Publicar primeiro projeto gratuito'
          : 'Enviar primeira proposta técnica',
      done:
        roleType === 'client' ? myClientProjects.length > 0 : myFreelancerBids.length > 0,
      actionLabel: roleType === 'client' ? 'Publicar Projeto' : 'Explorar Projetos',
      onAction: () => {
        if (roleType === 'client') {
          onOpenNewProjectModal();
        } else {
          onSelectProjectAndNavigate(projects[0]?.id || '', 'marketplace');
        }
      },
    },
  ];
  const onboardingDoneCount = onboardingSteps.filter((s) => s.done).length;
  const showOnboardingCard = onboardingDoneCount < onboardingSteps.length;

  const inputClass =
    'w-full px-3.5 py-2.5 text-xs bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-indigo-500/15 transition-colors';

  return (
    <div className="space-y-5">
      {/* Verification Warning if signed up with unverified email */}
      {!userProfile.isVerifiedAuth && (
        <div
          role="alert"
          className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Confirme seu e-mail ({userEmail || 'cadastrado'}) para liberar gravações
                no Firestore
              </p>
              <p className="text-amber-800/90 dark:text-amber-300/90">
                Por segurança, as regras do Firestore exigem e-mail verificado antes de
                publicar projetos, enviar propostas ou salvar seu perfil na nuvem.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={verifying}
              onClick={async () => {
                setVerifying(true);
                try {
                  await onResendVerificationEmail();
                } finally {
                  setVerifying(false);
                }
              }}
              className="px-3.5 py-2 font-semibold rounded-lg border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Reenviar E-mail</span>
            </button>
            <button
              type="button"
              disabled={verifying}
              onClick={async () => {
                setVerifying(true);
                try {
                  await onRefreshVerificationStatus();
                } finally {
                  setVerifying(false);
                }
              }}
              className="px-4 py-2 font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>Já Confirmei Meu E-mail</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOP BENTO ROW: Identity Banner (8 Cols) + Live Role Telemetry (4 Cols)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 bg-gradient-to-r from-[#2D1B4E] via-[#392261] to-[#1F2A5C] text-white rounded-2xl p-6 lg:p-7 shadow-md flex flex-col justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar
              src={avatarUrl || GENERATED_ASSETS.avatarEngineer1}
              name={displayName || 'Usuário Devana'}
              size="xl"
              className="border-2 border-sky-400"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-sky-300 font-semibold">
                <span>
                  {roleType === 'client'
                    ? 'Painel do Cliente (Contratante)'
                    : 'Painel do Profissional (Freelancer Tech)'}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {userProfile.isVerifiedAuth
                    ? `Conta Verificada (${userEmail || userProfile.uid.slice(0, 8)})`
                    : 'Aguardando verificação de e-mail'}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Olá, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 max-w-2xl">
                Configure seu perfil de <strong>Cliente</strong> ou{' '}
                <strong>Profissional (Freelancer)</strong> e gerencie seus projetos,
                propostas e pagamentos em Garantia.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/15">
            <button
              type="button"
              onClick={() => handleRoleSwitch('freelancer')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                roleType === 'freelancer'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white/10 text-indigo-100 hover:bg-white/15'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Perfil Profissional (Freelancer)</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('client')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                roleType === 'client'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white/10 text-indigo-100 hover:bg-white/15'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Perfil Cliente (Contratante)</span>
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Bento KPI Tile */}
        <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 lg:p-7 flex flex-col justify-between gap-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--primary)]">
              {roleType === 'client' ? 'Resumo Contratante' : 'Resumo Profissional'}
            </span>
            <Badge tone="success">0% Comissão</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 divide-x divide-[var(--border)]">
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block">
                {roleType === 'client' ? 'Em Garantia' : 'Ganhos'}
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[var(--text-primary)] mt-1 block">
                R$ {totalEscrowOrEarnings.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="pl-3">
              <span className="text-[11px] text-[var(--text-muted)] block">Ativos</span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[var(--primary)] mt-1 block">
                {activeCount}
              </span>
            </div>
            <div className="pl-3">
              <span className="text-[11px] text-[var(--text-muted)] block">
                Avaliação
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-amber-500 mt-1 inline-flex items-center gap-1">
                {avgRating > 0 ? avgRating.toFixed(1) : 'Novo'}
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)]">
            {roleType === 'client' ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={onOpenNewProjectModal}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Publicar Novo Projeto
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() =>
                  onSelectProjectAndNavigate(projects[0]?.id || '', 'marketplace')
                }
                className="w-full"
              >
                Buscar Projetos &amp; Enviar Propostas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          BENTO ANALYTICS & GUIDED ONBOARDING ROW (Authenticated Dashboard Only)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Lightweight SVG Performance Chart (7 or 12 Cols) */}
        <div
          className={`${
            showOnboardingCard ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-2xs`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                <span>
                  {roleType === 'freelancer'
                    ? 'Produtividade, Horas Auditadas & Entregas'
                    : 'Distribuição de Projetos & Custódia'}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Indicadores reais sincronizados em tempo real com seus projetos e commits.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
              <span>
                <strong className="text-[var(--text-primary)]">
                  {myTotalHours.toFixed(1)}h
                </strong>{' '}
                <span className="text-[var(--text-muted)]">auditadas</span>
              </span>
              <span>
                <strong className="text-[var(--text-primary)]">
                  {myFreelancerBids.length}
                </strong>{' '}
                <span className="text-[var(--text-muted)]">propostas</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Pure SVG Lightweight Bar Chart */}
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] block mb-3">
                {roleType === 'freelancer' && myWorklogs.length > 0
                  ? 'Horas por entrega recente'
                  : 'Orçamento dos projetos ativos (R$)'}
              </span>
              {chartBars.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-xs text-[var(--text-muted)] text-center">
                  Sem movimentações registradas ainda para exibir no gráfico.
                </div>
              ) : (
                <svg
                  viewBox="0 0 240 96"
                  className="w-full h-24 overflow-visible"
                  role="img"
                  aria-label="Gráfico de barras de desempenho recente"
                >
                  {chartBars.map((bar, i) => {
                    const barW = 24;
                    const gap = 14;
                    const x = i * (barW + gap) + 8;
                    const h = Math.max(8, Math.round((bar.pct / 100) * 62));
                    const y = 72 - h;
                    return (
                      <g key={`${bar.label}-${i}`}>
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={h}
                          rx={4}
                          className="fill-indigo-600 dark:fill-sky-400 transition-all duration-300"
                        />
                        <text
                          x={x + barW / 2}
                          y={y - 4}
                          textAnchor="middle"
                          className="fill-[var(--text-secondary)] text-[8px] font-mono font-semibold"
                        >
                          {bar.display}
                        </text>
                        <text
                          x={x + barW / 2}
                          y={88}
                          textAnchor="middle"
                          className="fill-[var(--text-muted)] text-[8px] font-mono"
                        >
                          {bar.label.slice(0, 6)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* SVG Pipeline Segmented Bar + Legend */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-secondary)]">
                  Pipeline de Contratos ({relevantProjects.length})
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {completedCount} concluído(s)
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden flex">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${(openCount / totalStatusCount) * 100}%` }}
                  title={`Abertos: ${openCount}`}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${(activeCount / totalStatusCount) * 100}%` }}
                  title={`Em execução: ${activeCount}`}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(completedCount / totalStatusCount) * 100}%` }}
                  title={`Concluídos: ${completedCount}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono tabular-nums text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-[var(--text-muted)]">Abertos: {openCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[var(--text-muted)]">Ativos: {activeCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[var(--text-muted)]">Fim: {completedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guided 3-Step Onboarding Card (5 Cols when pending) */}
        {showOnboardingCard && (
          <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Primeiros Passos na Devana
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Complete sua configuração para ganhar mais visibilidade.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[var(--primary)]">
                {onboardingDoneCount}/{onboardingSteps.length}
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${Math.round((onboardingDoneCount / onboardingSteps.length) * 100)}%`,
                }}
              />
            </div>

            <div className="space-y-2.5">
              {onboardingSteps.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {st.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        st.done
                          ? 'line-through text-[var(--text-muted)]'
                          : 'font-medium text-[var(--text-primary)]'
                      }`}
                    >
                      {st.label}
                    </span>
                  </span>
                  {!st.done && (
                    <button
                      type="button"
                      onClick={st.onAction}
                      className="text-[11px] font-semibold text-[var(--primary)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {st.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MAIN BENTO WORKSPACE: Form Tile (7 Cols) + Preview & Activity Tiles (5 Cols)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT 7 COLS: Create / Edit Profile Bento Tile */}
        <form
          id="dashboard-profile-form"
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <span className="text-xs font-bold text-[var(--primary)]">
                Configuração de Conta Devana
              </span>
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {roleType === 'freelancer'
                  ? 'Atualizar Perfil de Profissional (Freelancer)'
                  : 'Atualizar Perfil de Cliente (Contratante)'}
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              0% Taxa · Firestore
            </span>
          </div>

          {/* Step 1: Role Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">
              1. Escolha como você deseja atuar na Devana
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div
                onClick={() => handleRoleSwitch('freelancer')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  roleType === 'freelancer'
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)] ring-2 ring-indigo-500/15'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                    <Code2 className="w-4 h-4 text-[var(--primary)]" />
                    <span>Sou Profissional (Freelancer)</span>
                  </span>
                  {roleType === 'freelancer' && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Apareça no diretório de talentos, envie propostas técnicas, registre
                  horas/commits e receba 100% dos pagamentos.
                </p>
              </div>

              <div
                onClick={() => handleRoleSwitch('client')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  roleType === 'client'
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)] ring-2 ring-indigo-500/15'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Sou Cliente (Contratante)</span>
                  </span>
                  {roleType === 'client' && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Publique projetos de tecnologia gratuitamente, avalie propostas de
                  desenvolvedores e pague com Garantia Escrow.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Core Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {roleType === 'freelancer'
                  ? 'Seu Nome Profissional'
                  : 'Seu Nome ou Nome da Empresa'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={
                  roleType === 'freelancer'
                    ? 'Seu nome completo'
                    : 'Seu nome ou nome da empresa'
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {roleType === 'freelancer'
                  ? 'Usuário do GitHub (Portfólio de Commits)'
                  : 'Organização / Repositório GitHub (Opcional)'}
              </label>
              <input
                type="text"
                maxLength={60}
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Ex: seu-usuario-github"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className={roleType === 'freelancer' ? 'sm:col-span-2' : 'sm:col-span-3'}
            >
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {roleType === 'freelancer'
                  ? 'Título Profissional & Stack Principal'
                  : 'Setor de Atuação & Foco de Contratação'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={
                  roleType === 'freelancer'
                    ? 'Ex: Engenheiro Full-Stack Node.js, React & Cloud'
                    : 'Ex: Cliente · Fintech, SaaS & E-commerce'
                }
                className={inputClass}
              />
            </div>

            {roleType === 'freelancer' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Valor/Hora (R$/h)
                </label>
                <input
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              {roleType === 'freelancer'
                ? 'Resumo Técnico, Experiência & Certificações'
                : 'Sobre a Empresa & Tipos de Projetos que Você Contrata'}
            </label>
            <textarea
              rows={4}
              required
              maxLength={600}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                roleType === 'freelancer'
                  ? 'Descreva sua experiência em arquitetura de software, principais entregas, linguagens e certificações...'
                  : 'Descreva sua empresa, stack tecnológica utilizada e o que você busca em especialistas freelancers...'
              }
              className={inputClass}
            />
          </div>

          {/* Avatar Preset / URL Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Foto de Perfil (URL ou Avatar Padrão)
            </label>
            <input
              type="text"
              maxLength={500}
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="URL da sua foto de perfil"
              className={inputClass}
            />
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {[
                { label: 'Avatar Tech 1', url: GENERATED_ASSETS.avatarEngineer1 },
                { label: 'Avatar Tech 2', url: GENERATED_ASSETS.avatarEngineer2 },
                { label: 'Avatar Corporativo', url: GENERATED_ASSETS.avatarClient1 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAvatarUrl(preset.url)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    avatarUrl === preset.url
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {roleType === 'freelancer' && (
            <label className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="rounded border-slate-300 accent-indigo-600 w-4 h-4"
              />
              <span>
                <strong>Disponível para contratação imediata</strong> (exibir meu perfil
                no Diretório de Freelancers da Devana)
              </span>
            </label>
          )}

          <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
            <span className="text-[11px] text-[var(--text-muted)]">
              Perfil persistido em{' '}
              <code className="font-mono">/users/{userProfile.uid.slice(0, 12)}...</code>
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              disabled={!userProfile.isVerifiedAuth}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {roleType === 'freelancer'
                ? 'Salvar Meu Perfil de Freelancer'
                : 'Salvar Meu Perfil de Cliente'}
            </Button>
          </div>
        </form>

        {/* RIGHT 5 COLS: Live Public Preview Bento Tile + Activity Bento Tile */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Card Preview Bento Tile */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--primary)]">
                Pré-Visualização Pública
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>
                  {userProfile.isVerifiedAuth
                    ? roleType === 'freelancer'
                      ? 'Freelancer Verificado'
                      : 'Cliente Verificado'
                    : 'Pendente de Verificação'}
                </span>
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={avatarUrl || GENERATED_ASSETS.avatarEngineer1}
                    name={displayName || 'Seu Nome'}
                    size="lg"
                    className="border-2 border-indigo-500"
                  />
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                      {displayName || 'Seu Nome'}
                    </h3>
                    <p className="text-xs text-[var(--primary)] font-medium">
                      {specialty || 'Especialidade / Empresa'}
                    </p>
                  </div>
                </div>
                {roleType === 'freelancer' && (
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className="text-sm font-bold text-[var(--text-primary)] block">
                      R$ {hourlyRate || '0'}/h
                    </span>
                    <span className="text-[11px] text-amber-500 font-bold">
                      {userProfile.completedProjects > 0
                        ? `★ ${userProfile.reputationScore.toFixed(2)}`
                        : 'Novo'}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {bio || 'Sua descrição aparecerá aqui.'}
              </p>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                <span className="inline-flex items-center gap-1">
                  <FolderGit2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                  {githubUsername
                    ? `github.com/${githubUsername}`
                    : 'GitHub não vinculado'}
                </span>
                <span>
                  {roleType === 'freelancer'
                    ? isAvailable
                      ? 'Visível no Diretório'
                      : 'Oculto no Diretório'
                    : 'Conta Contratante'}
                </span>
              </div>
            </div>
          </div>

          {/* Role-Specific Activity Bento Tile */}
          {roleType === 'client' ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Seus Projetos Publicados
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Gerencie escopos e aprove propostas técnicas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenNewProjectModal}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Projeto</span>
                </button>
              </div>

              {myClientProjects.length === 0 ? (
                <div className="py-6 text-center space-y-2 text-xs text-[var(--text-muted)]">
                  <p>Você ainda não publicou nenhum projeto.</p>
                  <button
                    type="button"
                    onClick={onOpenNewProjectModal}
                    className="text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                  >
                    Publicar meu primeiro projeto →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {myClientProjects.slice(0, 4).map((proj) => (
                    <div
                      key={proj.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--text-primary)] truncate">
                          {proj.title}
                        </p>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">
                          R$ {proj.budget.toLocaleString('pt-BR')} ·{' '}
                          {(bidsByProject[proj.id] || []).length} propostas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectProjectAndNavigate(proj.id, 'marketplace')}
                        className="px-3 py-1.5 text-[11px] font-semibold text-[var(--primary)] border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-[var(--primary-subtle)] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Gerenciar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 space-y-4 shadow-2xs">
              <div className="pb-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Atalhos do Diário &amp; Marketplace
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Acesse projetos abertos ou registre entregas de código.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onSelectProjectAndNavigate(projects[0]?.id || '', 'marketplace')
                  }
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explorar Projetos &amp; Enviar Propostas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSelectProjectAndNavigate(projects[0]?.id || '', 'workspace')
                  }
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[var(--primary)] bg-[var(--primary-subtle)] hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <GitCommit className="w-4 h-4" />
                  <span>Abrir Diário de Trabalho &amp; Commits Git</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
