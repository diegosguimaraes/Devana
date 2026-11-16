import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import { apiClient } from '../../../lib';
import type { ActiveUserProfileData, AppProject } from '../../../types/domain';
import type { GithubCommitItem, LogWorklogPayload } from '../types';

export async function fetchGithubCommitsApi(repo: string): Promise<{
  repo: string;
  commits: GithubCommitItem[];
}> {
  return apiClient.get<{ repo: string; commits: GithubCommitItem[] }>(
    `/api/github/commits?repo=${encodeURIComponent(repo)}`
  );
}

export async function logWorklogDocument(
  project: AppProject,
  currentUser: ActiveUserProfileData,
  payload: LogWorklogPayload
): Promise<string> {
  const worklogId = `wl_${Date.now()}`;
  try {
    await setDoc(doc(db, 'projects', project.id, 'worklogs', worklogId), {
      projectId: project.id,
      projectOwnerId: project.ownerId,
      freelancerId: currentUser.uid,
      freelancerName: currentUser.displayName.slice(0, 80),
      hours: payload.hours,
      commitHash: payload.commitHash,
      branchName: payload.branchName,
      commitMessage: payload.commitMessage,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `projects/${project.id}/worklogs/${worklogId}`
    );
  }
  return worklogId;
}

export async function sendChatMessageDocument(
  project: AppProject,
  currentUser: ActiveUserProfileData,
  text: string
): Promise<string> {
  const msgId = `msg_${Date.now()}`;
  try {
    await setDoc(doc(db, 'projects', project.id, 'messages', msgId), {
      projectId: project.id,
      projectOwnerId: project.ownerId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName.slice(0, 80),
      text: text.slice(0, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `projects/${project.id}/messages/${msgId}`
    );
  }
  return msgId;
}
