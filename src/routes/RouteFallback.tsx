import React from 'react';
import type { ShellSection } from '../components/layout/AppShell';
import {
  ProjectCardSkeleton,
  ProjectDetailSkeleton,
} from '../components/ProjectCardSkeleton';
import { LoadingState, Skeleton } from '../components/ui';

export interface RouteFallbackProps {
  section: ShellSection | 'landing';
}

export const RouteFallback: React.FC<RouteFallbackProps> = ({ section }) => {
  if (section === 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] px-4">
        <LoadingState label="Carregando plataforma Devana..." />
      </div>
    );
  }

  if (section === 'marketplace') {
    return (
      <div
        className="space-y-6"
        role="status"
        aria-busy="true"
        aria-label="Carregando marketplace"
      >
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-7 space-y-5">
              {[0, 1, 2].map((idx) => (
                <ProjectCardSkeleton key={idx} index={idx} />
              ))}
            </div>
            <div className="xl:col-span-5">
              <ProjectDetailSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
      <LoadingState label="Carregando ambiente..." />
    </div>
  );
};
