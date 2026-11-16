import { sendEmailVerification, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { sanitizeFirestoreUid } from '../../../lib';
import { clearOfflineSnapshot } from '../../../utils/offlineVault';

export async function signOutFirebaseUser(
  firebaseUser: FirebaseUser | null
): Promise<void> {
  if (firebaseUser) {
    clearOfflineSnapshot(sanitizeFirestoreUid(firebaseUser.uid));
  }
  await signOut(auth);
}

export async function resendVerificationEmailForUser(
  firebaseUser: FirebaseUser
): Promise<void> {
  await sendEmailVerification(firebaseUser);
}

export async function checkUserDocExists(uid: string): Promise<boolean> {
  const cleanUid = sanitizeFirestoreUid(uid);
  const snap = await getDoc(doc(db, 'users', cleanUid));
  return snap.exists();
}

export async function createDefaultUserDoc(
  uid: string,
  payload: Record<string, unknown>
): Promise<void> {
  const cleanUid = sanitizeFirestoreUid(uid);
  await setDoc(doc(db, 'users', cleanUid), {
    ...payload,
    uid: cleanUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
