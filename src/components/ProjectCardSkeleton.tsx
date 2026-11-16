import React from 'react';
import { motion } from 'motion/react';
import { Skeleton } from './ui/States';

interface ProjectCardSkeletonProps {
  index?: number;
}

export const ProjectCardSkeleton: React.FC<ProjectCardSkeletonProps> = ({
  index = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{
        duration: 0.22,
        delay: Math.min(index * 0.06, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
      aria-hidden="true"
      className="font-sans bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-7 mb-5 flex flex-col gap-4 shadow-[var(--shadow-elevated)]"
    >
      {/* Top Row: Title + Metadata on Left, Budget + Status on Right */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5 min-w-0 flex-1">
          <Skeleton className="h-6 w-4/5 sm:w-3/4 rounded-lg" />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <span className="text-[var(--border-strong)] select-none">·</span>
            <Skeleton className="h-3.5 w-20" />
            <span className="text-[var(--border-strong)] select-none">·</span>
            <Skeleton className="h-3.5 w-16" />
            <span className="text-[var(--border-strong)] select-none">·</span>
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>

        <div className="sm:text-right shrink-0 flex flex-col sm:items-end gap-1.5">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>

      {/* Project Description */}
      <div className="flex flex-col gap-2 py-0.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>

      {/* Bottom Row: Client Info + Action Button */}
      <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-3.5 w-28" />
          <span className="text-[var(--border-strong)] select-none">·</span>
          <Skeleton className="h-3.5 w-11" />
          <span className="text-[var(--border-strong)] select-none">·</span>
          <Skeleton className="h-3.5 w-28" />
        </div>

        <Skeleton className="h-[38px] w-36 rounded-xl shrink-0" />
      </div>
    </motion.div>
  );
};

export const ProjectDetailSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
      className="xl:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 space-y-6 shadow-[var(--shadow-subtle)] sticky top-20"
    >
      <div className="border-b border-[var(--border)] pb-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-3.5 w-14" />
        </div>
        <Skeleton className="h-5 w-4/5 rounded-lg" />
      </div>

      <div className="rounded-lg border border-[var(--border)] p-4 space-y-2.5 bg-[var(--surface-subtle)]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-9 w-full rounded-lg mt-2" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3.5 w-40" />
        <div className="rounded-lg border border-[var(--border)] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[var(--border)]">
        <Skeleton className="h-3.5 w-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </motion.div>
  );
};
