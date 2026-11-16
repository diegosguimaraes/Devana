import { useCallback, useEffect, useState } from 'react';
import type { ShellSection } from '../components/layout/AppShell';
import type { MarketplaceTab } from '../features/projects/types';
import { type AppViewMode, buildPathForState, resolveLocationState } from './routeConfig';

export function useAppRouter() {
  const initialRoute =
    typeof window !== 'undefined'
      ? resolveLocationState(window.location.pathname)
      : {
          viewMode: 'landing' as AppViewMode,
          activeSection: 'marketplace' as ShellSection,
        };

  const [viewMode, setViewModeState] = useState<AppViewMode>(initialRoute.viewMode);
  const [activeSection, setActiveSectionState] = useState<ShellSection>(
    initialRoute.activeSection
  );
  const [marketplaceTab, setMarketplaceTabState] = useState<MarketplaceTab>(
    initialRoute.marketplaceTab || 'projects'
  );

  const syncHistoryPath = useCallback(
    (nextViewMode: AppViewMode, nextSection: ShellSection, nextTab: MarketplaceTab) => {
      if (typeof window === 'undefined') return;
      const targetPath = buildPathForState(nextViewMode, nextSection, nextTab);
      if (window.location.pathname !== targetPath) {
        window.history.pushState(
          { viewMode: nextViewMode, activeSection: nextSection, marketplaceTab: nextTab },
          '',
          targetPath
        );
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const resolved = resolveLocationState(window.location.pathname);
      setViewModeState(resolved.viewMode);
      setActiveSectionState(resolved.activeSection);
      if (resolved.marketplaceTab) {
        setMarketplaceTabState(resolved.marketplaceTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToLanding = useCallback(() => {
    setViewModeState('landing');
    syncHistoryPath('landing', activeSection, marketplaceTab);
  }, [activeSection, marketplaceTab, syncHistoryPath]);

  const navigateToSection = useCallback(
    (section: ShellSection, tabOverride?: MarketplaceTab) => {
      const nextTab = tabOverride ?? marketplaceTab;
      setViewModeState('app');
      setActiveSectionState(section);
      if (tabOverride) {
        setMarketplaceTabState(tabOverride);
      }
      syncHistoryPath('app', section, nextTab);
    },
    [marketplaceTab, syncHistoryPath]
  );

  const setMarketplaceTab = useCallback(
    (tab: MarketplaceTab) => {
      setMarketplaceTabState(tab);
      if (viewMode === 'app' && activeSection === 'marketplace') {
        syncHistoryPath('app', 'marketplace', tab);
      }
    },
    [activeSection, syncHistoryPath, viewMode]
  );

  return {
    viewMode,
    activeSection,
    marketplaceTab,
    navigateToLanding,
    navigateToSection,
    setMarketplaceTab,
  };
}
