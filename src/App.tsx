import React, { Suspense } from 'react';
import {
  AppFooter,
  AppModals,
  AppSectionRoutes,
  FeedbackBanner,
  LazyAppShell,
  LazyLandingPage,
  MarketplaceSubHeaderBar,
  RouteErrorBoundary,
  RouteFallback,
  useAppController,
} from './routes';

export default function App() {
  const app = useAppController();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      <RouteErrorBoundary>
        <Suspense
          fallback={
            <RouteFallback
              section={app.viewMode === 'landing' ? 'landing' : app.activeSection}
            />
          }
        >
          {app.viewMode === 'landing' ? (
            <LazyLandingPage
              projects={app.projects}
              specialists={app.availableSpecialists}
              currentUser={app.currentUser}
              metricsSummary={app.metricsSummary}
              darkMode={app.darkMode}
              onToggleDarkMode={app.toggleDarkMode}
              onEnterMarketplace={app.enterMarketplaceFromLanding}
              onOpenAuthModal={(role, mode = 'login') => app.openAuthModal(mode, role)}
              onOpenUserPanel={() => app.navigateToSection('user_panel')}
            />
          ) : (
            <LazyAppShell
              activeSection={app.activeSection}
              onSelectSection={(sec) => app.navigateToSection(sec)}
              onGoHome={app.navigateToLanding}
              onOpenNewProject={app.openNewProjectIfVerified}
              onOpenAuthModal={(mode) => app.openAuthModal(mode)}
              onSignOut={app.signOutWithFeedback}
              currentUser={app.currentUser}
              darkMode={app.darkMode}
              onToggleDarkMode={app.toggleDarkMode}
              isOnline={app.isOnline}
              searchQuery={app.searchQuery}
              onSearchChange={app.setSearchQuery}
              breadcrumbSublabel={app.breadcrumbSublabel}
              notifications={app.notifications}
              pushPrefs={app.pushPrefs}
              subHeaderBar={
                app.activeSection === 'marketplace' ? (
                  <MarketplaceSubHeaderBar
                    categoryFilter={app.categoryFilter}
                    onSelectCategory={app.setCategoryFilter}
                  />
                ) : undefined
              }
              feedbackBanner={
                <FeedbackBanner feedback={app.formFeedback} onClose={app.clearFeedback} />
              }
              footer={
                <AppFooter
                  onGoHome={app.navigateToLanding}
                  onNavigateSection={app.navigateToSection}
                />
              }
            >
              <AppSectionRoutes {...app.sectionRoutesProps} />
            </LazyAppShell>
          )}
        </Suspense>
      </RouteErrorBoundary>

      <AppModals {...app.modalsProps} />
    </div>
  );
}
