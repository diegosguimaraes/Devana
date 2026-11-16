import { useMemo, useState } from 'react';
import type { AppBid, AppProject } from '../../../types/domain';
import type { ProjectSortOption } from '../types';

export { useProjects } from '../../../hooks/useProjects';

export function useProjectFilters(
  projects: AppProject[],
  bidsByProject: Record<string, AppBid[]>,
  searchQuery: string,
  setSearchQuery: (val: string) => void
) {
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [projectSortBy, setProjectSortBy] = useState<ProjectSortOption>('recent');

  const clearProjectFilters = () => {
    setCategoryFilter('Todos');
    setStatusFilter('all');
    setBudgetFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    categoryFilter !== 'Todos' ||
    statusFilter !== 'all' ||
    budgetFilter !== 'all' ||
    searchQuery.trim() !== '';

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      const matchesCat = categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesBudget =
        budgetFilter === 'all' ||
        (budgetFilter === 'up_to_10k' && p.budget <= 10000) ||
        (budgetFilter === 'over_10k' && p.budget > 10000);
      const matchesSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.repoUrl.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesStatus && matchesBudget && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (projectSortBy) {
        case 'budget_desc':
          return b.budget - a.budget;
        case 'budget_asc':
          return a.budget - b.budget;
        case 'deadline_asc':
          return a.deadlineDays - b.deadlineDays;
        case 'bids_asc':
          return (bidsByProject[a.id] || []).length - (bidsByProject[b.id] || []).length;
        case 'recent':
        default:
          return b.createdAtIso.localeCompare(a.createdAtIso);
      }
    });
  }, [
    projects,
    categoryFilter,
    statusFilter,
    budgetFilter,
    searchQuery,
    projectSortBy,
    bidsByProject,
  ]);

  return {
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    budgetFilter,
    setBudgetFilter,
    projectSortBy,
    setProjectSortBy,
    hasActiveFilters,
    clearProjectFilters,
    filteredProjects,
  };
}
