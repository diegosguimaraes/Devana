import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  GitCommit,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Code2,
  Star,
  Sun,
  Moon,
} from 'lucide-react';
import {
  AppProject,
  SpecialistProfile,
  ActiveUserProfileData,
  GENERATED_ASSETS,
  resolveResponsiveImageProps,
} from '../types/domain';

interface LandingPageProps {
  projects: AppProject[];
  specialists: SpecialistProfile[];
  currentUser: ActiveUserProfileData | null;
  metricsSummary: {
    totalEscrowBrl: number;
    totalHours: number;
    totalCommits: number;
    averageRating: number;
  };
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onEnterMarketplace: (
    initialTab?: 'projects' | 'freelancers',
    category?: string,
    search?: string
  ) => void;
  onOpenAuthModal: (
    initialRole: 'client' | 'freelancer',
    initialMode?: 'login' | 'register'
  ) => void;
  onOpenUserPanel: () => void;
}

function SafeLandingImage({
  src,
  alt,
  className,
  fallbackInitials,
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackInitials?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold select-none ${className || ''}`}
        role="img"
        aria-label={alt}
      >
        <span>{fallbackInitials || alt.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }

  const variant = resolveResponsiveImageProps(src);

  return (
    <picture className="block w-full h-full">
      {variant && (
        <source
          type="image/webp"
          srcSet={variant.webpSrcSet}
          sizes={sizes || variant.sizes}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={variant?.width}
        height={variant?.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    </picture>
  );
}

export const LandingPage: React.FC<LandingPageProps> = ({
  projects,
  specialists,
  currentUser,
  metricsSummary,
  darkMode,
  onToggleDarkMode,
  onEnterMarketplace,
  onOpenAuthModal,
  onOpenUserPanel,
}) => {
  const [heroSearch, setHeroSearch] = useState('');
  const [howItWorksTab, setHowItWorksTab] = useState<'client' | 'freelancer'>('client');

  const categories = [
    {
      name: 'Backend & APIs',
      desc: 'Microsserviços Go, Node.js, Rust, mensageria Kafka e integrações financeiras de alta disponibilidade.',
      stack: 'Node.js · Go · PostgreSQL · gRPC',
    },
    {
      name: 'Frontend & UI',
      desc: 'Aplicações React, Next.js, Design Systems acessíveis e interfaces em tempo real.',
      stack: 'React 19 · TypeScript · Tailwind',
    },
    {
      name: 'Cloud & DevOps',
      desc: 'Kubernetes, Terraform, pipelines CI/CD, observabilidade e otimização AWS/GCP.',
      stack: 'Kubernetes · Terraform · AWS · GCP',
    },
    {
      name: 'Dados & IA',
      desc: 'Engenharia de dados, pipelines ETL, modelos preditivos e arquiteturas RAG corporativas.',
      stack: 'Python · PyTorch · BigQuery · RAG',
    },
    {
      name: 'Mobile',
      desc: 'Aplicativos nativos e multiplataforma iOS/Android com sincronização offline-first.',
      stack: 'React Native · Kotlin · Swift',
    },
    {
      name: 'Segurança & Auditoria',
      desc: 'Pentest, hardening OWASP, criptografia ponta a ponta AES-256-GCM e revisão de código.',
      stack: 'OWASP · Zero-Trust · DevSecOps',
    },
  ];

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnterMarketplace('projects', 'Todos', heroSearch);
  };

  const clientSteps = [
    {
      step: '01',
      title: 'Crie sua Conta de Cliente e Publique Grátis',
      desc: 'Descreva o escopo técnico, prazo, orçamento e vincule o repositório Git do projeto sem pagar nenhuma taxa.',
    },
    {
      step: '02',
      title: 'Compare Propostas Técnicas (Bids)',
      desc: 'Analise propostas de engenheiros verificados, histórico de entregas, nota de código e perfil GitHub.',
    },
    {
      step: '03',
      title: 'Deposite em Garantia & Acompanhe Commits',
      desc: 'O valor fica protegido em custódia (Escrow). Acompanhe horas, commits SHA e converse no chat em tempo real.',
    },
    {
      step: '04',
      title: 'Aprove a Entrega e Exporte Relatórios',
      desc: 'Quando tudo estiver validado, libere 100% do pagamento ao especialista e baixe o relatório auditado em PDF/CSV.',
    },
  ];

  const freelancerSteps = [
    {
      step: '01',
      title: 'Crie sua Conta de Profissional Tech',
      desc: 'Cadastre suas habilidades, valor/hora, bio técnica e conecte seu usuário do GitHub para destacar seu portfólio.',
    },
    {
      step: '02',
      title: 'Envie Propostas em Projetos Reais',
      desc: 'Filtre projetos por stack (Backend, Frontend, Cloud, IA, Mobile, Segurança) e envie sua arquitetura e orçamento.',
    },
    {
      step: '03',
      title: 'Use o Diário de Trabalho + Git Sync',
      desc: 'Inicie o cronômetro integrado e importe commits reais do seu repositório GitHub como prova de entrega.',
    },
    {
      step: '04',
      title: 'Receba 100% do Valor (Taxa Zero)',
      desc: 'Com o pagamento garantido em custódia desde o início, você recebe 100% do valor combinado e constrói sua reputação.',
    },
  ];

  const platformCapabilities = [
    {
      icon: GitCommit,
      title: 'Controle de Versão & Commits Git',
      desc: 'Sincronize repositórios públicos do GitHub para anexar hashes SHA, branches e mensagens de commit diretamente às horas registradas.',
      meta: 'Integração GitHub API · SHA Auditado',
    },
    {
      icon: Clock,
      title: 'Diário de Trabalho & Cronômetro',
      desc: 'Cronômetro em tempo real integrado à sala de trabalho para contabilizar horas produtivas com transparência total.',
      meta: 'Stopwatch ao vivo · Histórico por sprint',
    },
    {
      icon: MessageSquare,
      title: 'Chat em Tempo Real & Alertas Push',
      desc: 'Comunicação instantânea via WebSockets autenticados com indicador de presença, digitação ao vivo e notificações.',
      meta: 'WebSocket /ws · Sincronização Firestore',
    },
    {
      icon: FileText,
      title: 'Relatórios PDF/CSV & Cofre Offline',
      desc: 'Exporte métricas financeiras e técnicas em PDF ou CSV, compartilhe por e-mail com checksum SHA-256 e consulte cache offline.',
      meta: 'Exportação PDF/CSV · Cofre por UID',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-toast)] focus:px-4 focus:py-2 focus:rounded-[var(--radius-md)] focus:bg-[var(--primary)] focus:text-white focus:text-xs focus:font-semibold"
      >
        Pular para o conteúdo principal
      </a>

      {/* =====================================================================
          TOP BAR (Brand + Single-Line Navigation + Primary CTA)
      ===================================================================== */}
      <header className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-between gap-8 px-6 lg:px-10 h-16 bg-[#2D1B4E] dark:bg-[#1A1030] text-white border-b border-indigo-900/40 shadow-xs">
        <a
          href="#top"
          className="font-display text-2xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Devana
        </a>

        <nav
          aria-label="Navegação Principal da Devana"
          className="hidden md:flex items-center gap-7 text-xs font-medium text-indigo-100/85"
        >
          <a
            href="#como-funciona"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Como Funciona
          </a>
          <a
            href="#categorias"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Especialidades Tech
          </a>
          <a
            href="#recursos"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Diário Git &amp; Garantia
          </a>
          <a
            href="#talentos"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Talentos Verificados
          </a>
          <button
            type="button"
            onClick={() => onEnterMarketplace('projects')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Explorar Projetos ({projects.length})
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <button
              type="button"
              onClick={onOpenUserPanel}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-[var(--radius-md)] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              Meu Painel ({currentUser.displayName.split(' ')[0]})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal('freelancer', 'login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-[var(--radius-md)] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              Entrar / Criar Conta
            </button>
          )}
        </div>
      </header>

      {/* Sub-bar with Quick Role Shortcuts & Theme Toggle */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-6 lg:px-10 py-2">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--primary)]">
              Plataforma 100% Gratuita (0% Comissão)
            </span>
            <span aria-hidden="true" className="text-[var(--border-strong)]">
              ·
            </span>
            <button
              type="button"
              onClick={() =>
                currentUser ? onOpenUserPanel() : onOpenAuthModal('client', 'register')
              }
              className="hover:text-[var(--primary)] font-medium cursor-pointer"
            >
              Para Empresas (Contratar Dev)
            </button>
            <span aria-hidden="true" className="text-[var(--border-strong)]">
              ·
            </span>
            <button
              type="button"
              onClick={() =>
                currentUser
                  ? onOpenUserPanel()
                  : onOpenAuthModal('freelancer', 'register')
              }
              className="hover:text-[var(--primary)] font-medium cursor-pointer"
            >
              Para Profissionais (Trabalhar como Freelancer)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onEnterMarketplace('projects')}
              className="text-[var(--primary)] font-semibold hover:underline cursor-pointer"
            >
              Ir Direto ao Marketplace →
            </button>
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="p-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <main id="main-content">
        {/* =====================================================================
          HERO SECTION (Clean Editorial Split + Integrated Metric Divider Bar)
      ===================================================================== */}
        <section
          id="top"
          className="bg-gradient-to-br from-[#2D1B4E] via-[#3B2063] to-[#1E295B] text-white border-b border-indigo-900/40"
        >
          <div className="max-w-[1380px] mx-auto px-6 lg:px-10 pt-14 pb-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              {/* Left: Value Proposition & Primary Actions */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-sky-300">
                  <span>Devana Tech Marketplace</span>
                  <span aria-hidden="true">·</span>
                  <span>0% de Taxa para Clientes e Devs</span>
                  <span aria-hidden="true">·</span>
                  <span>Garantia Escrow + Git Commits</span>
                </div>

                <h1
                  className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08]"
                  style={{ textWrap: 'balance' }}
                >
                  Conectando empresas aos melhores freelancers de tecnologia da América
                  Latina.
                </h1>

                <p className="text-sm sm:text-base text-indigo-100 leading-relaxed max-w-xl">
                  Na <strong>Devana</strong>, clientes publicam projetos com pagamento
                  protegido em Garantia e desenvolvedores comprovam cada hora trabalhada
                  vinculando commits reais do GitHub — sem taxas de intermediação.
                </p>

                <form
                  onSubmit={handleHeroSearchSubmit}
                  role="search"
                  aria-label="Buscar freelancers ou projetos por habilidade"
                  className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl"
                >
                  <div className="relative flex-1 flex items-center">
                    <Search
                      className="w-4 h-4 text-slate-500 ml-3 shrink-0"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      aria-label="Qual habilidade você procura?"
                      placeholder="Qual habilidade você procura? (Ex: React, Node.js, Go, IA)..."
                      className="w-full px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white bg-transparent rounded-md"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Buscar Agora
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      currentUser
                        ? onOpenUserPanel()
                        : onOpenAuthModal('client', 'register')
                    }
                    className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Quero Contratar (Criar Conta Cliente)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      currentUser
                        ? onOpenUserPanel()
                        : onOpenAuthModal('freelancer', 'register')
                    }
                    className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-sky-300" />
                    <span>Quero Trabalhar (Criar Conta Freelancer)</span>
                  </button>
                </div>
              </div>

              {/* Right: Clean Single Hero Image Showcase */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl aspect-[4/3] lg:aspect-[16/11]">
                <SafeLandingImage
                  src={GENERATED_ASSETS.heroWorkspace}
                  alt="Ambiente de trabalho de engenharia na plataforma Devana"
                  className="w-full h-full object-cover"
                  fallbackInitials="DV"
                  priority
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1030]/95 via-[#1A1030]/35 to-transparent flex flex-col justify-end p-7 text-white space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Garantia Devana · Taxa 0%</span>
                    </span>
                    <span className="font-mono tabular-nums text-sky-300 font-semibold">
                      AES-256-GCM + Git Sync
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    Publique demandas reais, receba propostas técnicas verificadas e
                    libere 100% do pagamento ao concluir cada entrega.
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-indigo-200 pt-2 border-t border-white/15">
                    <span>Autenticação Firebase &amp; Regras RLS</span>
                    <span className="font-mono text-emerald-400">Produção Ativa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Horizontal Metric Strip (Hairline Dividers, Not Bento Cards) */}
            <dl className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/15">
              <div className="lg:pr-8 flex flex-col gap-1">
                <dt className="text-xs text-indigo-100">Projetos Abertos</dt>
                <dd className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-white">
                  {projects.length}
                </dd>
              </div>
              <div className="lg:px-8 flex flex-col gap-1">
                <dt className="text-xs text-indigo-100">Especialistas Ativos</dt>
                <dd className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-white">
                  {specialists.length}
                </dd>
              </div>
              <div className="lg:px-8 flex flex-col gap-1">
                <dt className="text-xs text-indigo-100">Valor em Custódia</dt>
                <dd className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-white">
                  R$ {metricsSummary.totalEscrowBrl.toLocaleString('pt-BR')}
                </dd>
              </div>
              <div className="lg:pl-8 flex flex-col gap-1">
                <dt className="text-xs text-indigo-100">Comissão da Plataforma</dt>
                <dd className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-emerald-400">
                  0% (100% Grátis)
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* =====================================================================
          SECTION 1: COMO FUNCIONA (Clean Symmetrical 4-Step Editorial Flow)
      ===================================================================== */}
        <section
          id="como-funciona"
          className="py-16 px-6 lg:px-10 max-w-[1380px] mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-bold tracking-wide text-[var(--primary)]">
                Fluxo Transparente e 100% Gratuito
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
                Como a Devana funciona para você
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="Selecionar perfil de uso"
              className="inline-flex p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] self-start"
            >
              <button
                type="button"
                role="tab"
                aria-selected={howItWorksTab === 'client'}
                onClick={() => setHowItWorksTab('client')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  howItWorksTab === 'client'
                    ? 'bg-[#2D1B4E] text-white shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Para Clientes (Contratar)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={howItWorksTab === 'freelancer'}
                onClick={() => setHowItWorksTab('freelancer')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  howItWorksTab === 'freelancer'
                    ? 'bg-[#2D1B4E] text-white shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Para Profissionais (Freelancers)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {(howItWorksTab === 'client' ? clientSteps : freelancerSteps).map((item) => (
              <div
                key={item.step}
                className="rounded-xl p-6 flex flex-col justify-between gap-5 bg-[var(--surface)] border border-[var(--border)]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono tabular-nums text-xs font-bold text-[var(--primary)]">
                      Etapa {item.step}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <h3 className="font-display text-base font-bold text-[var(--text-primary)] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                  <span>
                    {howItWorksTab === 'client'
                      ? 'Fluxo do Contratante'
                      : 'Fluxo do Especialista'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    0% Comissão
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl p-6 bg-[var(--primary-subtle)] border border-indigo-200/80 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {howItWorksTab === 'client'
                  ? 'Pronto para publicar sua demanda de tecnologia com segurança total?'
                  : 'Pronto para criar seu perfil profissional e enviar propostas agora?'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Você pode alternar entre os modos Cliente e Profissional a qualquer
                momento dentro do seu Painel de Usuário autenticado.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                currentUser
                  ? onOpenUserPanel()
                  : onOpenAuthModal(howItWorksTab, 'register')
              }
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>
                {currentUser
                  ? 'Abrir Meu Painel'
                  : howItWorksTab === 'client'
                    ? 'Criar Conta de Cliente'
                    : 'Criar Conta de Freelancer'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* =====================================================================
          SECTION 2: ESPECIALIDADES TECH (Clean Uniform 3-Column Index)
      ===================================================================== */}
        <section
          id="categorias"
          className="py-16 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--border)]"
        >
          <div className="max-w-[1380px] mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-wide text-[var(--primary)]">
                  Categorias de Engenharia
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
                  Encontre especialistas para qualquer camada da sua arquitetura
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onEnterMarketplace('projects', 'Todos')}
                className="text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>Ver todas as oportunidades abertas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => {
                const count = projects.filter((p) => p.category === cat.name).length;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => onEnterMarketplace('projects', cat.name)}
                    className="group w-full text-left p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] hover:border-[var(--primary)] transition-colors cursor-pointer flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-2.5 w-full">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-display text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                          {cat.name}
                        </h3>
                        <span className="font-mono tabular-nums text-xs text-[var(--text-muted)] whitespace-nowrap">
                          {count} {count === 1 ? 'projeto' : 'projetos'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                        {cat.desc}
                      </p>
                    </div>
                    <div className="w-full pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--primary)]">
                      <span>{cat.stack}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
          SECTION 3: INFRAESTRUTURA DE GESTÃO & CUSTÓDIA (Clean Structured Layout)
      ===================================================================== */}
        <section
          id="recursos"
          className="py-16 px-6 lg:px-10 max-w-[1380px] mx-auto space-y-10"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-wide text-[var(--primary)]">
              Infraestrutura Completa de Gestão e Segurança
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
              Tudo o que clientes e desenvolvedores precisam em um único lugar
            </h2>
          </div>

          {/* Highlight Banner: Escrow Devana */}
          <div className="bg-[#2D1B4E] dark:bg-[#1A1030] text-white rounded-2xl p-7 lg:p-9 border border-indigo-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span>Custódia Financeira Protegida · Taxa Zero</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold">
                Garantia Devana (Escrow Seguro com 0% de Taxa)
              </h3>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                O cliente deposita o valor acordado no início do projeto e a liberação de
                100% ocorre mediante entrega validada, protegendo contratantes e
                especialistas sem intermediários cobrando comissão.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 lg:pt-0 lg:pl-8 border-t lg:border-t-0 lg:border-l border-white/15 text-xs shrink-0">
              <div>
                <span className="font-mono text-sky-300 block">Passo 01</span>
                <span className="font-semibold">Proposta Aceita via Batch</span>
              </div>
              <div>
                <span className="font-mono text-sky-300 block">Passo 02</span>
                <span className="font-semibold">Custódia Retida</span>
              </div>
              <div>
                <span className="font-mono text-emerald-400 block">Passo 03</span>
                <span className="font-semibold">100% Liberado</span>
              </div>
            </div>
          </div>

          {/* Clean 4-Column Symmetrical Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {platformCapabilities.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
                    {feat.meta}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Horizontal Security Strip */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 lg:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Backup AES-256-GCM, Cofre de PII &amp; Row-Level Security
                </h3>
                <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  Dados pessoais isolados e cifrados no navegador com PBKDF2 +
                  AES-256-GCM, validação binária de Magic Bytes em uploads, schemas Zod
                  estritos e verificação real de tokens JWT Firebase no servidor.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-xs font-mono shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-4 lg:pt-0 lg:pl-6">
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">
                  Cifra PII
                </span>
                <span className="font-bold text-[var(--text-primary)]">AES-256-GCM</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">
                  Uploads
                </span>
                <span className="font-bold text-[var(--text-primary)]">Magic Bytes</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">Banco</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Firestore RLS
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
          SECTION 4: PROFISSIONAIS VERIFICADOS (Clean Uniform Directory Preview)
      ===================================================================== */}
        <section
          id="talentos"
          className="py-16 px-6 lg:px-10 bg-[var(--surface)] border-t border-[var(--border)]"
        >
          <div className="max-w-[1380px] mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-wide text-[var(--primary)]">
                  Diretório Oficial Devana
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
                  Profissionais de tecnologia cadastrados na plataforma
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onEnterMarketplace('freelancers')}
                className="text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>Ver diretório completo de freelancers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {specialists.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    Nenhum profissional publicado no diretório no momento.
                  </p>
                  <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    Crie sua conta gratuita de Profissional Freelancer na Devana e
                    habilite seu perfil para aparecer no diretório oficial, conectar
                    commits Git e receber convites para projetos reais com 0% de comissão.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    currentUser
                      ? onOpenUserPanel()
                      : onOpenAuthModal('freelancer', 'register')
                  }
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {currentUser
                    ? 'Configurar Meu Perfil Tech'
                    : 'Cadastrar Meu Perfil Tech'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {specialists.slice(0, 3).map((spec) => (
                  <div
                    key={spec.uid}
                    className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3.5">
                        <SafeLandingImage
                          src={spec.avatarUrl}
                          alt={spec.displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-bold text-[var(--text-primary)] truncate">
                            {spec.displayName}
                          </h3>
                          <p className="text-xs text-[var(--primary)] font-medium truncate">
                            {spec.specialty}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5 font-mono tabular-nums">
                            <span className="text-amber-500 font-bold inline-flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {spec.completedProjects > 0
                                ? spec.reputationScore.toFixed(2)
                                : 'Novo'}
                            </span>
                            <span>·</span>
                            <span>{spec.completedProjects} projetos</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                        {spec.bio}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-4">
                      <div className="font-mono tabular-nums">
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          Taxa Horária
                        </span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          R$ {spec.hourlyRate}/h
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEnterMarketplace('freelancers')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Ver Perfil &amp; Contratar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
          FINAL CONVERSION BANNER
      ===================================================================== */}
        <section className="py-14 px-6 lg:px-10 bg-[#2D1B4E] text-white">
          <div className="max-w-[1380px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Comece gratuitamente hoje mesmo na Devana
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                Crie sua conta real de <strong>Cliente</strong> para publicar projetos ou
                de <strong>Profissional (Freelancer)</strong> para enviar propostas
                técnicas e receber 100% do valor das suas entregas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() =>
                  currentUser ? onOpenUserPanel() : onOpenAuthModal('client', 'register')
                }
                className="px-5 py-3 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Criar Conta de Cliente
              </button>
              <button
                type="button"
                onClick={() =>
                  currentUser
                    ? onOpenUserPanel()
                    : onOpenAuthModal('freelancer', 'register')
                }
                className="px-5 py-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/30 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Criar Conta de Freelancer
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 lg:px-10 py-8">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-base text-[#2D1B4E] dark:text-white">
              Devana
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Marketplace Gratuito de Freelancers de Tecnologia &amp; Pagamentos em
              Garantia
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onEnterMarketplace('projects')}
              className="hover:text-[var(--primary)] cursor-pointer"
            >
              Explorar Projetos
            </button>
            <button
              type="button"
              onClick={() => onEnterMarketplace('freelancers')}
              className="hover:text-[var(--primary)] cursor-pointer"
            >
              Diretório de Devs
            </button>
            <button
              type="button"
              onClick={() =>
                currentUser ? onOpenUserPanel() : onOpenAuthModal('freelancer', 'login')
              }
              className="hover:text-[var(--primary)] cursor-pointer"
            >
              Painel do Usuário
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
