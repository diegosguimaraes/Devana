import type { AppBid, AppProject } from '../../types/domain';

export type MarketplaceTab = 'projects' | 'freelancers';

export type ProjectSortOption =
  'recent' | 'budget_desc' | 'budget_asc' | 'deadline_asc' | 'bids_asc';

export interface ProjectFiltersState {
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  budgetFilter: string;
  sortBy: ProjectSortOption;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  category: AppProject['category'];
  budget: number;
  deadlineDays: number;
  repoUrl: string;
}

export type { AppBid, AppProject };
