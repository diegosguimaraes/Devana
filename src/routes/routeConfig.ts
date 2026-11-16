import type { ShellSection } from '../components/layout/AppShell';
import type { MarketplaceTab } from '../features/projects/types';

export type AppViewMode = 'landing' | 'app';

export interface ResolvedRouteState {
  viewMode: AppViewMode;
  activeSection: ShellSection;
  marketplaceTab?: MarketplaceTab;
}

export const SECTION_TO_PATH: Record<ShellSection, string> = {
  marketplace: '/explorar',
  user_panel: '/painel',
  workspace: '/workspace',
  escrow: '/garantia',
  reports: '/relatorios',
  security: '/seguranca',
};

export function resolveLocationState(pathname: string): ResolvedRouteState {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  switch (normalized) {
    case '/explorar':
    case '/marketplace':
      return {
        viewMode: 'app',
        activeSection: 'marketplace',
        marketplaceTab: 'projects',
      };
    case '/freelancers':
      return {
        viewMode: 'app',
        activeSection: 'marketplace',
        marketplaceTab: 'freelancers',
      };
    case '/painel':
    case '/dashboard':
      return {
        viewMode: 'app',
        activeSection: 'user_panel',
      };
    case '/workspace':
      return {
        viewMode: 'app',
        activeSection: 'workspace',
      };
    case '/garantia':
    case '/escrow':
      return {
        viewMode: 'app',
        activeSection: 'escrow',
      };
    case '/relatorios':
    case '/reports':
      return {
        viewMode: 'app',
        activeSection: 'reports',
      };
    case '/seguranca':
    case '/security':
      return {
        viewMode: 'app',
        activeSection: 'security',
      };
    case '/':
    default:
      return {
        viewMode: 'landing',
        activeSection: 'marketplace',
      };
  }
}

export function buildPathForState(
  viewMode: AppViewMode,
  activeSection: ShellSection,
  marketplaceTab: MarketplaceTab = 'projects'
): string {
  if (viewMode === 'landing') {
    return '/';
  }
  if (activeSection === 'marketplace' && marketplaceTab === 'freelancers') {
    return '/freelancers';
  }
  return SECTION_TO_PATH[activeSection] || '/explorar';
}
