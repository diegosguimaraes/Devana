import type {
  ActiveUserProfileData,
  SpecialistProfile,
  UserRoleType,
} from '../../types/domain';
import type { SaveProfilePayload } from '../../hooks/useAuth';

export type SpecialistSortOption =
  'reputation_desc' | 'rate_asc' | 'rate_desc' | 'projects_desc';

export type {
  ActiveUserProfileData,
  SpecialistProfile,
  UserRoleType,
  SaveProfilePayload,
};
