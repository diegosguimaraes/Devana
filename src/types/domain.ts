export type UserRoleType = 'freelancer' | 'client';

export interface ActiveUserProfileData {
  uid: string;
  displayName: string;
  roleType: UserRoleType;
  specialty: string;
  hourlyRate: number;
  githubUsername: string;
  bio: string;
  avatarUrl: string;
  reputationScore: number;
  completedProjects: number;
  isAvailableForHire: boolean;
  isVerifiedAuth: boolean;
}

export interface AppProject {
  id: string;
  title: string;
  description: string;
  category:
    | 'Backend & APIs'
    | 'Frontend & UI'
    | 'Cloud & DevOps'
    | 'Dados & IA'
    | 'Mobile'
    | 'Segurança & Auditoria';
  budget: number;
  deadlineDays: number;
  repoUrl: string;
  ownerId: string;
  ownerName: string;
  assignedFreelancerId: string;
  assignedFreelancerName: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  escrowStatus: 'unfunded' | 'funded' | 'released' | 'refunded';
  createdAtIso: string;
}

export type EscrowLedgerState = 'pending' | 'in_escrow' | 'released' | 'refunded';

export interface EscrowLedgerEntry {
  id: string;
  projectId: string;
  projectOwnerId: string;
  freelancerId: string;
  actorUid: string;
  state: EscrowLedgerState;
  amount: number;
  commissionAmount: 0;
  idempotencyKey: string;
  createdAtIso: string;
}

export interface AppBid {
  id: string;
  projectId: string;
  projectOwnerId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerSpecialty: string;
  amount: number;
  deliveryDays: number;
  pitch: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAtIso: string;
}

export interface AppWorklog {
  id: string;
  projectId: string;
  projectOwnerId: string;
  freelancerId: string;
  freelancerName: string;
  hours: number;
  commitHash: string;
  branchName: string;
  commitMessage: string;
  createdAtIso: string;
}

export interface AppChatMessage {
  id: string;
  projectId: string;
  projectOwnerId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAtIso: string;
}

export interface AppReview {
  id: string;
  projectId: string;
  projectOwnerId: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  rating: number;
  codeQualityScore: number;
  communicationScore: number;
  comment: string;
  createdAtIso: string;
}

export interface SpecialistProfile {
  uid: string;
  displayName: string;
  roleType?: UserRoleType;
  specialty: string;
  hourlyRate: number;
  reputationScore: number;
  completedProjects: number;
  githubUsername: string;
  avatarUrl: string;
  bio: string;
  isAvailableForHire: boolean;
}

export const GENERATED_ASSETS = {
  heroWorkspace: '/src/assets/images/hero_workspace_visual_1794833040014.jpg',
  avatarEngineer1: '/src/assets/images/avatar_engineer_1_1794833036312.jpg',
  avatarEngineer2: '/src/assets/images/avatar_engineer_2_1794833038277.jpg',
  avatarClient1: '/src/assets/images/avatar_client_1_1794833038783.jpg',
} as const;

export interface ResponsiveImageMetadata {
  webpSrcSet: string;
  sizes: string;
  width: number;
  height: number;
}

export const GENERATED_ASSET_VARIANTS: Record<string, ResponsiveImageMetadata> = {
  [GENERATED_ASSETS.heroWorkspace]: {
    webpSrcSet:
      '/src/assets/images/hero_workspace_visual_1794833040014-640.webp 640w, /src/assets/images/hero_workspace_visual_1794833040014-1200.webp 1200w',
    sizes: '(max-width: 1024px) 100vw, 600px',
    width: 1200,
    height: 670,
  },
  [GENERATED_ASSETS.avatarEngineer1]: {
    webpSrcSet:
      '/src/assets/images/avatar_engineer_1_1794833036312-128.webp 128w, /src/assets/images/avatar_engineer_1_1794833036312-256.webp 256w',
    sizes: '(max-width: 640px) 64px, 96px',
    width: 256,
    height: 256,
  },
  [GENERATED_ASSETS.avatarEngineer2]: {
    webpSrcSet:
      '/src/assets/images/avatar_engineer_2_1794833038277-128.webp 128w, /src/assets/images/avatar_engineer_2_1794833038277-256.webp 256w',
    sizes: '(max-width: 640px) 64px, 96px',
    width: 256,
    height: 256,
  },
  [GENERATED_ASSETS.avatarClient1]: {
    webpSrcSet:
      '/src/assets/images/avatar_client_1_1794833038783-128.webp 128w, /src/assets/images/avatar_client_1_1794833038783-256.webp 256w',
    sizes: '(max-width: 640px) 64px, 96px',
    width: 256,
    height: 256,
  },
};

export function resolveResponsiveImageProps(
  src?: string | null
): ResponsiveImageMetadata | null {
  if (!src) return null;
  return GENERATED_ASSET_VARIANTS[src] || null;
}
