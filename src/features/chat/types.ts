import type {
  ActiveUserProfileData,
  AppChatMessage,
  AppProject,
  AppWorklog,
} from '../../types/domain';

export interface GithubCommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface LogWorklogPayload {
  hours: number;
  commitHash: string;
  branchName: string;
  commitMessage: string;
}

export type { ActiveUserProfileData, AppChatMessage, AppProject, AppWorklog };
