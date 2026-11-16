import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import type { ActiveUserProfileData } from '../../../types/domain';
import type { CreateProjectPayload } from '../types';

export async function createProjectDocument(
  currentUser: ActiveUserProfileData,
  payload: CreateProjectPayload
): Promise<string> {
  const projectId = `proj_${Date.now()}`;
  try {
    await setDoc(doc(db, 'projects', projectId), {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      budget: payload.budget,
      deadlineDays: payload.deadlineDays,
      repoUrl: payload.repoUrl,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName.slice(0, 80),
      assignedFreelancerId: '',
      assignedFreelancerName: '',
      status: 'open',
      escrowStatus: 'unfunded',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}`);
  }
  return projectId;
}
