import React, { useState } from 'react';
import {
  Briefcase,
  LayoutDashboard,
  FolderGit2,
  ShieldCheck,
  FileText,
  Lock,
  Home,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
  LogOut,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  X,
  User as UserIcon,
} from 'lucide-react';
import { Avatar, Button, Dropdown, Popover, Tooltip, Checkbox } from '../ui';
import { cn } from '../ui/utils';
import type { ActiveUserProfileData } from '../../types/domain';

export type ShellSection =
  'marketplace' | 'user_panel' | 'workspace' | 'escrow' | 'reports' | 'security';

export interface ShellNotificationItem {
  id: string;
  title: string;
  category: string;
  timestamp: string;
}

export interface AppShellProps {
  activeSection: ShellSection;
  onSelectSection: (section: ShellSection) => void;
  onGoHome: () => void;
  onOpenNewProject: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onSignOut: () => void;
  currentUser: ActiveUserProfileData | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOnline: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  breadcrumbSublabel?: string;
  notifications: ShellNotificationItem[];
  pushPrefs: {
    pushEnabled: boolean;
    setPushEnabled: (v: boolean) => void;
    notifyOnBid: boolean;
    setNotifyOnBid: (v: boolean) => void;
    notifyOnEscrow: boolean;
    setNotifyOnEscrow: (v: boolean) => void;
    notifyOnMessage: boolean;
    setNotifyOnMessage: (v: boolean) => void;
  };
  feedbackBanner?: React.ReactNode;
  subHeaderBar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const SECTION_META: Record<
  ShellSection,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  marketplace: {
    label: 'Encontre Trabalho',
    shortLabel: 'Explorar',
    icon: Briefcase,
  },
  user_panel: {
    label: 'Meu Painel & Perfil',
    shortLabel: 'Painel',
    icon: LayoutDashboard,
  },
  workspace: {
    label: 'Diário & Git',
    shortLabel: 'Diário',
    icon: FolderGit2,
  },
  escrow: {
    label: 'Garantia & Pagamentos',
    shortLabel: 'Custódia',
    icon: ShieldCheck,
  },
  reports: {
    label: 'Relatórios & Backup',
    shortLabel: 'Relatórios',
    icon: FileText,
  },
  security: {
    label: 'Segurança & API',
    shortLabel: 'Segurança',
    icon: Lock,
  },
};

const NAV_ORDER: ShellSection[] = [
  'marketplace',
  'user_panel',
  'workspace',
  'escrow',
  'reports',
  'security',
];

export const AppShell: React.FC<AppShellProps> = ({
  activeSection,
  onSelectSection,
  onGoHome,
  onOpenNewProject,
  onOpenAuthModal,
  onSignOut,
  currentUser,
  darkMode,
  onToggleDarkMode,
  isOnline,
  searchQuery,
  onSearchChange,
  breadcrumbSublabel,
  notifications,
  pushPrefs,
  feedbackBanner,
  subHeaderBar,
  footer,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('devana:sidebar-collapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('devana:sidebar-collapsed', next ? '1' : '0');
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSection !== 'marketplace') {
      onSelectSection('marketplace');
    }
  };

  const activeMeta = SECTION_META[activeSection];

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* WCAG Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-toast)] focus:px-4 focus:py-2 focus:rounded-[var(--radius-md)] focus:bg-[var(--primary)] focus:text-white focus:text-xs focus:font-semibold"
      >
        Pular para o conteúdo principal
      </a>

      {/* =====================================================================
          DESKTOP COLLAPSIBLE SIDEBAR (240px expanded / 72px collapsed)
      ===================================================================== */}
      <aside
        aria-label="Barra lateral de navegação Devana"
        className={cn(
          'hidden md:flex flex-col shrink-0 sticky top-0 h-screen bg-[var(--surface)] border-r border-[var(--border)] z-[var(--z-drawer)] transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-out)] select-none',
          sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {/* Sidebar Header: Brand Wordmark + Collapse Trigger */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-[var(--border)] shrink-0',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          )}
        >
          {!sidebarCollapsed && (
            <a
              href="#inicio"
              onClick={(e) => {
                e.preventDefault();
                onGoHome();
              }}
              title="Voltar para o Início da Devana"
              className="font-display text-2xl font-bold tracking-tight text-[#2D1B4E] dark:text-white whitespace-nowrap"
            >
              Devana
            </a>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'
            }
            aria-expanded={!sidebarCollapsed}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          aria-label="Navegação Principal"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        >
          {NAV_ORDER.map((id) => {
            const meta = SECTION_META[id];
            const Icon = meta.icon;
            const isActive = activeSection === id;

            const buttonEl = (
              <button
                key={id}
                type="button"
                onClick={() => onSelectSection(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full flex items-center gap-3 rounded-[var(--radius-md)] text-xs font-medium transition-colors duration-[var(--duration-fast)] cursor-pointer',
                  sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{meta.label}</span>}
              </button>
            );

            return sidebarCollapsed ? (
              <Tooltip key={id} content={meta.label} side="bottom">
                {buttonEl}
              </Tooltip>
            ) : (
              buttonEl
            );
          })}
        </nav>

        {/* Sidebar Footer Utilities */}
        <div className="p-3 border-t border-[var(--border)] space-y-1.5">
          {sidebarCollapsed ? (
            <Tooltip content="Início" side="bottom">
              <button
                type="button"
                onClick={onGoHome}
                aria-label="Voltar para o Início"
                className="w-full flex items-center justify-center py-2.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={onGoHome}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Início</span>
            </button>
          )}

          <div
            className={cn(
              'flex items-center text-[11px] text-[var(--text-muted)] pt-1',
              sidebarCollapsed ? 'justify-center' : 'justify-between px-3'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              {!sidebarCollapsed && <span>{isOnline ? 'Sincronizado' : 'Offline'}</span>}
            </span>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          RIGHT VIEWPORT COLUMN (Header + Content + Footer + Mobile Bottom Nav)
      ===================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky App Top Header (64px) */}
        <header className="sticky top-0 z-[var(--z-sticky)] h-16 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Wordmark + Desktop Contextual Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="#inicio"
              onClick={(e) => {
                e.preventDefault();
                onGoHome();
              }}
              className="md:hidden font-display text-xl font-bold tracking-tight text-[#2D1B4E] dark:text-white whitespace-nowrap shrink-0"
            >
              Devana
            </a>

            <nav
              aria-label="Breadcrumb"
              className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)] min-w-0"
            >
              <button
                type="button"
                onClick={onGoHome}
                className="hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap"
              >
                Início
              </button>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap">
                {activeMeta.label}
              </span>
              {breadcrumbSublabel && (
                <>
                  <ChevronRight
                    className="w-3.5 h-3.5 shrink-0 hidden lg:inline"
                    aria-hidden="true"
                  />
                  <span className="hidden lg:inline truncate max-w-[220px] text-[var(--text-secondary)]">
                    {breadcrumbSublabel}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Center: Global Search Input */}
          <form
            onSubmit={handleGlobalSearchSubmit}
            className="hidden lg:flex items-center flex-1 max-w-md relative"
            role="search"
            aria-label="Busca global na Devana"
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar projetos, stacks ou especialistas..."
              aria-label="Buscar projetos, stacks ou especialistas"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Right: Primary CTA + Notifications Popover + Theme + User Account Dropdown */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={onOpenNewProject}
              className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">Publicar Projeto</span>
              <span className="sm:hidden">Publicar</span>
            </Button>

            {/* Notifications Popover */}
            <Popover
              align="right"
              triggerAriaLabel={`Notificações (${notifications.length})`}
              panelClassName="w-80 sm:w-96 p-4 space-y-3"
              trigger={
                <span
                  aria-hidden="true"
                  className="relative inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--primary)] text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </span>
              }
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Central de Alertas Devana
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if ('Notification' in window) {
                      Notification.requestPermission();
                    }
                  }}
                  className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Autorizar Push
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-3 text-center">
                    Nenhuma atualização recente.
                  </p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className="py-2 text-xs flex items-start justify-between gap-2"
                    >
                      <span className="text-[var(--text-primary)] leading-snug">
                        {n.title}
                      </span>
                      <span className="font-mono tabular-nums text-[10px] text-[var(--text-muted)] shrink-0">
                        {new Date(n.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2.5 border-t border-[var(--border)] space-y-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                  Preferências de alerta ao vivo
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <Checkbox
                    label="Alertas em tempo real"
                    checked={pushPrefs.pushEnabled}
                    onChange={(e) => pushPrefs.setPushEnabled(e.target.checked)}
                  />
                  <Checkbox
                    label="Novas propostas recebidas"
                    checked={pushPrefs.notifyOnBid}
                    onChange={(e) => pushPrefs.setNotifyOnBid(e.target.checked)}
                  />
                  <Checkbox
                    label="Movimentações de Garantia (Escrow)"
                    checked={pushPrefs.notifyOnEscrow}
                    onChange={(e) => pushPrefs.setNotifyOnEscrow(e.target.checked)}
                  />
                  <Checkbox
                    label="Mensagens na sala de trabalho"
                    checked={pushPrefs.notifyOnMessage}
                    onChange={(e) => pushPrefs.setNotifyOnMessage(e.target.checked)}
                  />
                </div>
              </div>
            </Popover>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User Avatar Dropdown OR Auth Buttons */}
            {currentUser ? (
              <Dropdown
                align="right"
                triggerAriaLabel={`Menu da conta de ${currentUser.displayName}`}
                trigger={
                  <span className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors cursor-pointer">
                    <Avatar
                      src={currentUser.avatarUrl}
                      name={currentUser.displayName}
                      size="sm"
                    />
                    <span className="hidden xl:inline text-xs font-semibold text-[var(--text-primary)] max-w-[120px] truncate">
                      {currentUser.displayName.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </span>
                }
                items={[
                  {
                    id: 'panel',
                    label: `Meu Painel (${currentUser.roleType === 'client' ? 'Cliente' : 'Freelancer'})`,
                    icon: <UserIcon className="w-3.5 h-3.5" />,
                    onSelect: () => onSelectSection('user_panel'),
                  },
                  {
                    id: 'security',
                    label: 'Segurança & API',
                    icon: <Lock className="w-3.5 h-3.5" />,
                    onSelect: () => onSelectSection('security'),
                  },
                  {
                    id: 'home',
                    label: 'Início',
                    icon: <Home className="w-3.5 h-3.5" />,
                    onSelect: onGoHome,
                  },
                  {
                    id: 'signout',
                    label: 'Sair da Conta',
                    icon: <LogOut className="w-3.5 h-3.5" />,
                    danger: true,
                    onSelect: onSignOut,
                  },
                ]}
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<LogIn className="w-3.5 h-3.5" />}
                  onClick={() => onOpenAuthModal('login')}
                >
                  Entrar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenAuthModal('register')}
                  className="hidden sm:inline-flex"
                >
                  Criar Conta
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Optional Contextual Sub-Header (e.g. Marketplace Tech Category Filters) */}
        {subHeaderBar}

        {/* Optional Live Feedback Banner */}
        {feedbackBanner}

        {/* Main Content Viewport */}
        <main
          id="main-content"
          className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-24 md:py-8"
        >
          {children}
        </main>

        {/* Footer */}
        {footer}
      </div>

      {/* =====================================================================
          MOBILE STICKY BOTTOM NAVIGATION (< md, strict height <= 64px / <= 15% vh)
      ===================================================================== */}
      <nav
        aria-label="Navegação Rápida Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-[var(--z-drawer)] h-16 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-2 pb-[env(safe-area-inset-bottom)] grid grid-cols-5 items-center"
      >
        {(['marketplace', 'user_panel', 'workspace', 'escrow'] as ShellSection[]).map(
          (id) => {
            const meta = SECTION_META[id];
            const Icon = meta.icon;
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectSection(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'text-[var(--primary)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-full">{meta.shortLabel}</span>
              </button>
            );
          }
        )}

        {/* 5th slot: More / Reports / Security / Home */}
        <div className="flex items-center justify-center">
          <Dropdown
            align="right"
            placement="top"
            triggerAriaLabel="Mais seções de navegação"
            trigger={
              <span
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-1 px-2 text-[10px] font-medium cursor-pointer',
                  activeSection === 'reports' || activeSection === 'security'
                    ? 'text-[var(--primary)] font-semibold'
                    : 'text-[var(--text-muted)]'
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>Mais</span>
              </span>
            }
            items={[
              {
                id: 'reports',
                label: 'Relatórios & Backup',
                icon: <FileText className="w-3.5 h-3.5" />,
                onSelect: () => onSelectSection('reports'),
              },
              {
                id: 'security',
                label: 'Segurança & API',
                icon: <Lock className="w-3.5 h-3.5" />,
                onSelect: () => onSelectSection('security'),
              },
              {
                id: 'home',
                label: 'Início',
                icon: <Home className="w-3.5 h-3.5" />,
                onSelect: onGoHome,
              },
            ]}
          />
        </div>
      </nav>
    </div>
  );
};
