import { useMemo, useState } from 'react';
import type { SpecialistProfile } from '../../../types/domain';
import type { SpecialistSortOption } from '../types';

export function useSpecialistDirectory(
  specialists: SpecialistProfile[],
  searchQuery: string
) {
  const [specialistSortBy, setSpecialistSortBy] =
    useState<SpecialistSortOption>('reputation_desc');

  const filteredSpecialists = useMemo(() => {
    const filtered = specialists.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.displayName.toLowerCase().includes(q) ||
        s.specialty.toLowerCase().includes(q) ||
        s.bio.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (specialistSortBy) {
        case 'rate_asc':
          return a.hourlyRate - b.hourlyRate;
        case 'rate_desc':
          return b.hourlyRate - a.hourlyRate;
        case 'projects_desc':
          return b.completedProjects - a.completedProjects;
        case 'reputation_desc':
        default:
          return b.reputationScore - a.reputationScore;
      }
    });
  }, [specialists, searchQuery, specialistSortBy]);

  return {
    specialistSortBy,
    setSpecialistSortBy,
    filteredSpecialists,
  };
}
