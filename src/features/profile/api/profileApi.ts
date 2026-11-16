import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import { sanitizeFirestoreUid } from '../../../lib';
import type { SaveProfilePayload } from '../types';

export async function saveUserProfileRecord(
  uid: string,
  updated: SaveProfilePayload
): Promise<void> {
  const cleanUid = sanitizeFirestoreUid(uid);
  const userRef = doc(db, 'users', cleanUid);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: cleanUid,
        displayName: updated.displayName.slice(0, 80),
        roleType: updated.roleType,
        isAvailableForHire: updated.isAvailableForHire,
        specialty: updated.specialty.slice(0, 100),
        hourlyRate: updated.hourlyRate,
        reputationScore: 0,
        completedProjects: 0,
        githubUsername: updated.githubUsername.slice(0, 60),
        avatarUrl: updated.avatarUrl.slice(0, 500),
        bio: updated.bio.slice(0, 600),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName: updated.displayName.slice(0, 80),
        roleType: updated.roleType,
        isAvailableForHire: updated.isAvailableForHire,
        specialty: updated.specialty.slice(0, 100),
        hourlyRate: updated.hourlyRate,
        githubUsername: updated.githubUsername.slice(0, 60),
        avatarUrl: updated.avatarUrl.slice(0, 500),
        bio: updated.bio.slice(0, 600),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${cleanUid}`);
  }
}
