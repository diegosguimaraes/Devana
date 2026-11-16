import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { PendingProfileDraft } from '../components/AuthGatePanel';
import { sanitizeFirestoreUid, setAuthTokenProvider } from '../lib';
import { ActiveUserProfileData, GENERATED_ASSETS, UserRoleType } from '../types/domain';
import { clearOfflineSnapshot } from '../utils/offlineVault';

export interface SaveProfilePayload {
  displayName: string;
  roleType: UserRoleType;
  specialty: string;
  hourlyRate: number;
  githubUsername: string;
  bio: string;
  avatarUrl: string;
  isAvailableForHire: boolean;
}

interface UseAuthOptions {
  onUserSignedOut?: () => void;
  onUserAuthenticated?: (user: FirebaseUser, cleanUid: string) => void;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { onUserSignedOut, onUserAuthenticated } = options;

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [ownUserProfile, setOwnUserProfile] = useState<ActiveUserProfileData | null>(
    null
  );

  // Register global bearer token provider for centralized apiClient
  useEffect(() => {
    setAuthTokenProvider(async () => {
      if (!auth.currentUser) return null;
      return auth.currentUser.getIdToken();
    });
    return () => {
      setAuthTokenProvider(null);
    };
  }, []);

  const ensureVerifiedFirestoreProfile = useCallback(async (user: FirebaseUser) => {
    if (!user.emailVerified) return;
    const cleanUid = sanitizeFirestoreUid(user.uid);
    const userRef = doc(db, 'users', cleanUid);

    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) return;

      let draft: PendingProfileDraft | null = null;
      try {
        const raw = localStorage.getItem(`devana_pending_profile_${user.uid}`);
        if (raw) draft = JSON.parse(raw) as PendingProfileDraft;
      } catch {
        draft = null;
      }

      const googleRole =
        typeof sessionStorage !== 'undefined'
          ? (sessionStorage.getItem('devana_pending_google_role') as UserRoleType | null)
          : null;

      const roleType: UserRoleType = draft?.roleType || googleRole || 'freelancer';
      const displayName = (
        draft?.displayName ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'Usuário Devana'
      ).slice(0, 80);

      await setDoc(userRef, {
        uid: cleanUid,
        displayName,
        roleType,
        isAvailableForHire: roleType === 'freelancer',
        specialty: (
          draft?.specialty ||
          (roleType === 'client'
            ? 'Cliente · Tecnologia & Produto Digital'
            : 'Engenharia de Software Full-Stack')
        ).slice(0, 100),
        hourlyRate: roleType === 'client' ? 0 : draft?.hourlyRate || 150,
        reputationScore: 0,
        completedProjects: 0,
        githubUsername: (draft?.githubUsername || '').slice(0, 60),
        avatarUrl: (user.photoURL || GENERATED_ASSETS.avatarEngineer1).slice(0, 500),
        bio:
          roleType === 'client'
            ? 'Contratante verificado na Devana.'
            : 'Especialista verificado na plataforma Devana.',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        localStorage.removeItem(`devana_pending_profile_${user.uid}`);
        sessionStorage.removeItem('devana_pending_google_role');
      } catch {
        // Ignore storage errors
      }
    } catch {
      // Handled by real-time profile listener or user retry
    }
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setOwnUserProfile(null);
        onUserSignedOut?.();
        return;
      }

      const cleanUid = sanitizeFirestoreUid(user.uid);
      onUserAuthenticated?.(user, cleanUid);
      await ensureVerifiedFirestoreProfile(user);
    });

    return () => unsubscribe();
  }, [ensureVerifiedFirestoreProfile, onUserAuthenticated, onUserSignedOut]);

  // Authenticated user's own Firestore profile listener
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const cleanUid = sanitizeFirestoreUid(firebaseUser.uid);

    const unsubOwnProfile = onSnapshot(
      doc(db, 'users', cleanUid),
      (snap) => {
        if (!snap.exists()) {
          setOwnUserProfile(null);
          return;
        }
        const data = snap.data();
        setOwnUserProfile({
          uid: String(data.uid || cleanUid),
          displayName: String(data.displayName || 'Usuário Devana'),
          roleType:
            (data.roleType as UserRoleType) ||
            (data.isAvailableForHire ? 'freelancer' : 'client'),
          specialty: String(data.specialty || ''),
          hourlyRate: Number(data.hourlyRate || 0),
          reputationScore: Number(data.reputationScore || 0),
          completedProjects: Number(data.completedProjects || 0),
          githubUsername: String(data.githubUsername || ''),
          avatarUrl: String(data.avatarUrl || GENERATED_ASSETS.avatarEngineer1),
          bio: String(data.bio || ''),
          isAvailableForHire: Boolean(data.isAvailableForHire),
          isVerifiedAuth: firebaseUser.emailVerified,
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${cleanUid}`);
      }
    );

    return () => unsubOwnProfile();
  }, [authReady, firebaseUser]);

  // Active User Resolution (Strictly Real Authenticated User Only)
  const currentUser: ActiveUserProfileData | null = useMemo(() => {
    if (!firebaseUser) return null;
    const cleanUid = sanitizeFirestoreUid(firebaseUser.uid);

    if (ownUserProfile) {
      return {
        ...ownUserProfile,
        isVerifiedAuth: firebaseUser.emailVerified,
      };
    }

    let draft: PendingProfileDraft | null = null;
    try {
      const raw = localStorage.getItem(`devana_pending_profile_${firebaseUser.uid}`);
      if (raw) draft = JSON.parse(raw) as PendingProfileDraft;
    } catch {
      draft = null;
    }

    const fallbackRole: UserRoleType =
      draft?.roleType ||
      ((typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('devana_pending_google_role')) as UserRoleType) ||
      'freelancer';

    return {
      uid: cleanUid,
      displayName:
        draft?.displayName ||
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Usuário Devana',
      roleType: fallbackRole,
      specialty:
        draft?.specialty ||
        (fallbackRole === 'client'
          ? 'Cliente · Tecnologia & Produto Digital'
          : 'Engenharia de Software Full-Stack'),
      avatarUrl: firebaseUser.photoURL || GENERATED_ASSETS.avatarEngineer1,
      reputationScore: 0,
      completedProjects: 0,
      hourlyRate: fallbackRole === 'client' ? 0 : draft?.hourlyRate || 150,
      githubUsername: draft?.githubUsername || '',
      bio:
        fallbackRole === 'client'
          ? 'Contratante na plataforma Devana.'
          : 'Profissional de tecnologia cadastrado na Devana.',
      isAvailableForHire: fallbackRole === 'freelancer',
      isVerifiedAuth: firebaseUser.emailVerified,
    };
  }, [firebaseUser, ownUserProfile]);

  const signOutUser = useCallback(async () => {
    if (firebaseUser) {
      clearOfflineSnapshot(sanitizeFirestoreUid(firebaseUser.uid));
    }
    await signOut(auth);
  }, [firebaseUser]);

  const resendVerificationEmail = useCallback(async (): Promise<{
    ok: boolean;
    message: string;
  }> => {
    if (!firebaseUser) {
      return {
        ok: false,
        message: 'Nenhum usuário autenticado para reenviar a verificação.',
      };
    }
    try {
      await sendEmailVerification(firebaseUser);
      return {
        ok: true,
        message: `Novo e-mail de verificação enviado para ${firebaseUser.email}.`,
      };
    } catch {
      return {
        ok: false,
        message:
          'Aguarde alguns instantes antes de solicitar outro e-mail de verificação.',
      };
    }
  }, [firebaseUser]);

  const refreshVerificationStatus = useCallback(async (): Promise<{
    ok: boolean;
    verified: boolean;
    message: string;
  }> => {
    if (!auth.currentUser) {
      return {
        ok: false,
        verified: false,
        message: 'Nenhuma sessão ativa encontrada.',
      };
    }
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setFirebaseUser(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await ensureVerifiedFirestoreProfile(auth.currentUser);
      return {
        ok: true,
        verified: true,
        message: 'E-mail verificado com sucesso! Sua conta está 100% ativa no Firestore.',
      };
    }
    return {
      ok: false,
      verified: false,
      message:
        'E-mail ainda não confirmado. Clique no link enviado para sua caixa de entrada e tente novamente.',
    };
  }, [ensureVerifiedFirestoreProfile]);

  const saveUserProfile = useCallback(
    async (updated: SaveProfilePayload): Promise<{ ok: boolean; message: string }> => {
      if (!firebaseUser) {
        return { ok: false, message: 'Sessão não autenticada.' };
      }
      const cleanUid = sanitizeFirestoreUid(firebaseUser.uid);
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

      return {
        ok: true,
        message:
          updated.roleType === 'client'
            ? `Perfil de Cliente (${updated.displayName}) salvo no Firestore!`
            : `Perfil de Profissional Freelancer (${updated.displayName}) salvo no Firestore!`,
      };
    },
    [firebaseUser]
  );

  return {
    firebaseUser,
    authReady,
    ownUserProfile,
    currentUser,
    ensureVerifiedFirestoreProfile,
    signOutUser,
    resendVerificationEmail,
    refreshVerificationStatus,
    saveUserProfile,
  };
}
