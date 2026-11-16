import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatTimestampToIso, isSafeProjectId, sanitizeFirestoreUid } from '../lib';
import {
  ActiveUserProfileData,
  AppBid,
  AppChatMessage,
  AppProject,
  AppReview,
  AppWorklog,
  GENERATED_ASSETS,
  SpecialistProfile,
  UserRoleType,
} from '../types/domain';
import { loadOfflineSnapshot, saveOfflineSnapshot } from '../utils/offlineVault';

interface UseProjectsOptions {
  authReady: boolean;
  firebaseUser: FirebaseUser | null;
}

export function useProjects({ authReady, firebaseUser }: UseProjectsOptions) {
  const [isProjectsSyncing, setIsProjectsSyncing] = useState<boolean>(true);
  const syncTimerRef = useRef<number | null>(null);

  const [specialists, setSpecialists] = useState<SpecialistProfile[]>([]);
  const [openProjects, setOpenProjects] = useState<AppProject[]>([]);
  const [ownedProjects, setOwnedProjects] = useState<AppProject[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<AppProject[]>([]);

  const [bidsByProject, setBidsByProject] = useState<Record<string, AppBid[]>>({});
  const [worklogsByProject, setWorklogsByProject] = useState<
    Record<string, AppWorklog[]>
  >({});
  const [messagesByProject, setMessagesByProject] = useState<
    Record<string, AppChatMessage[]>
  >({});
  const [reviewsByProject, setReviewsByProject] = useState<Record<string, AppReview[]>>(
    {}
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const triggerInitialSync = useCallback((durationMs = 400) => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    setIsProjectsSyncing(true);
    syncTimerRef.current = window.setTimeout(() => {
      setIsProjectsSyncing(false);
      syncTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const hydrateOfflineSnapshot = useCallback((cleanUid: string) => {
    const cached = loadOfflineSnapshot<
      AppProject,
      AppBid,
      AppWorklog,
      AppChatMessage,
      AppReview
    >(cleanUid);
    if (cached) {
      if (cached.bidsByProject) setBidsByProject(cached.bidsByProject);
      if (cached.worklogsByProject) setWorklogsByProject(cached.worklogsByProject);
      if (cached.messagesByProject) setMessagesByProject(cached.messagesByProject);
      if (cached.reviewsByProject) setReviewsByProject(cached.reviewsByProject);
    }
  }, []);

  const resetUserCollections = useCallback(() => {
    setOwnedProjects([]);
    setAssignedProjects([]);
    setBidsByProject({});
    setWorklogsByProject({});
    setMessagesByProject({});
    setReviewsByProject({});
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!firebaseUser) {
      resetUserCollections();
      return;
    }
    hydrateOfflineSnapshot(sanitizeFirestoreUid(firebaseUser.uid));
  }, [authReady, firebaseUser, hydrateOfflineSnapshot, resetUserCollections]);

  const projects = useMemo(() => {
    const byId = new Map<string, AppProject>();
    for (const p of openProjects) byId.set(p.id, p);
    for (const p of assignedProjects) byId.set(p.id, p);
    for (const p of ownedProjects) byId.set(p.id, p);
    return Array.from(byId.values()).sort((a, b) =>
      b.createdAtIso.localeCompare(a.createdAtIso)
    );
  }, [openProjects, ownedProjects, assignedProjects]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  // Persist user-scoped offline snapshot whenever authenticated user data changes
  useEffect(() => {
    if (!firebaseUser) return;
    const cleanUid = sanitizeFirestoreUid(firebaseUser.uid);
    saveOfflineSnapshot(cleanUid, {
      updatedAtIso: new Date().toISOString(),
      projects,
      bidsByProject,
      worklogsByProject,
      messagesByProject,
      reviewsByProject,
    });
  }, [
    firebaseUser,
    projects,
    bidsByProject,
    worklogsByProject,
    messagesByProject,
    reviewsByProject,
  ]);

  // Real-time Firestore listeners (Open Marketplace + Authenticated User Collections)
  useEffect(() => {
    if (!authReady) return;

    const syncStartedAt = Date.now();
    let initialSnapshotDone = false;
    let finishTimer: number | null = null;

    const completeInitialSync = () => {
      if (initialSnapshotDone) return;
      initialSnapshotDone = true;
      const elapsed = Date.now() - syncStartedAt;
      const remaining = Math.max(0, 260 - elapsed);
      if (remaining === 0) {
        setIsProjectsSyncing(false);
      } else {
        finishTimer = window.setTimeout(() => {
          setIsProjectsSyncing(false);
          finishTimer = null;
        }, remaining);
      }
    };

    const safetyTimeout = window.setTimeout(() => {
      completeInitialSync();
    }, 1500);

    const mapProjectDoc = (d: {
      id: string;
      data: () => Record<string, unknown>;
    }): AppProject => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || ''),
        description: String(data.description || ''),
        category: (data.category as AppProject['category']) || 'Backend & APIs',
        budget: Number(data.budget || 0),
        deadlineDays: Number(data.deadlineDays || 14),
        repoUrl: String(data.repoUrl || ''),
        ownerId: String(data.ownerId || ''),
        ownerName: String(data.ownerName || ''),
        assignedFreelancerId: String(data.assignedFreelancerId || ''),
        assignedFreelancerName: String(data.assignedFreelancerName || ''),
        status: (data.status as AppProject['status']) || 'open',
        escrowStatus: (data.escrowStatus as AppProject['escrowStatus']) || 'unfunded',
        createdAtIso: formatTimestampToIso(data.createdAt),
      };
    };

    const openProjectsQuery = query(
      collection(db, 'projects'),
      where('status', '==', 'open')
    );
    const unsubOpen = onSnapshot(
      openProjectsQuery,
      (snapshot) => {
        setOpenProjects(snapshot.docs.map(mapProjectDoc));
        completeInitialSync();
      },
      (error) => {
        completeInitialSync();
        if (firebaseUser) {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        }
      }
    );

    const usersQuery = query(
      collection(db, 'users'),
      where('isAvailableForHire', '==', true)
    );
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const remoteSpecs: SpecialistProfile[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            uid: String(data.uid || d.id),
            displayName: String(data.displayName || 'Especialista'),
            roleType: (data.roleType as UserRoleType) || 'freelancer',
            specialty: String(data.specialty || 'Engenharia'),
            hourlyRate: Number(data.hourlyRate || 0),
            reputationScore: Number(data.reputationScore || 0),
            completedProjects: Number(data.completedProjects || 0),
            githubUsername: String(data.githubUsername || ''),
            avatarUrl: String(data.avatarUrl || GENERATED_ASSETS.avatarEngineer1),
            bio: String(data.bio || ''),
            isAvailableForHire: Boolean(data.isAvailableForHire),
          };
        });
        setSpecialists(remoteSpecs);
      },
      (error) => {
        if (firebaseUser) {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      }
    );

    let unsubOwnedProjects: (() => void) | undefined;
    let unsubAssignedProjects: (() => void) | undefined;

    if (firebaseUser) {
      const cleanUid = sanitizeFirestoreUid(firebaseUser.uid);

      unsubOwnedProjects = onSnapshot(
        query(collection(db, 'projects'), where('ownerId', '==', cleanUid)),
        (snapshot) => {
          setOwnedProjects(snapshot.docs.map(mapProjectDoc));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        }
      );

      unsubAssignedProjects = onSnapshot(
        query(collection(db, 'projects'), where('assignedFreelancerId', '==', cleanUid)),
        (snapshot) => {
          setAssignedProjects(snapshot.docs.map(mapProjectDoc));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        }
      );
    }

    return () => {
      window.clearTimeout(safetyTimeout);
      if (finishTimer !== null) {
        window.clearTimeout(finishTimer);
      }
      unsubOpen();
      unsubUsers();
      unsubOwnedProjects?.();
      unsubAssignedProjects?.();
    };
  }, [authReady, firebaseUser]);

  // Scoped Firestore subcollection listeners for selectedProject
  useEffect(() => {
    if (!authReady || !firebaseUser || !selectedProject?.id) return;
    const projId = selectedProject.id;
    if (!isSafeProjectId(projId)) return;

    const isOwner = selectedProject.ownerId === firebaseUser.uid;
    const isAssignedFreelancer =
      selectedProject.assignedFreelancerId === firebaseUser.uid;
    const isOpenProject = selectedProject.status === 'open';

    const bidsQuery = isOwner
      ? query(
          collection(db, 'projects', projId, 'bids'),
          where('projectId', '==', projId),
          where('projectOwnerId', '==', firebaseUser.uid)
        )
      : query(
          collection(db, 'projects', projId, 'bids'),
          where('projectId', '==', projId),
          where('freelancerId', '==', firebaseUser.uid)
        );
    const unsubBids = onSnapshot(
      bidsQuery,
      (snapshot) => {
        const loaded: AppBid[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            projectId: String(data.projectId),
            projectOwnerId: String(data.projectOwnerId),
            freelancerId: String(data.freelancerId),
            freelancerName: String(data.freelancerName),
            freelancerSpecialty: String(data.freelancerSpecialty || ''),
            amount: Number(data.amount),
            deliveryDays: Number(data.deliveryDays),
            pitch: String(data.pitch),
            status: data.status || 'pending',
            createdAtIso: formatTimestampToIso(data.createdAt),
          };
        });
        setBidsByProject((prev) => ({ ...prev, [projId]: loaded }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `projects/${projId}/bids`);
      }
    );

    let unsubWorklogs = () => {};
    if (isOwner || isAssignedFreelancer) {
      const worklogsQuery = query(
        collection(db, 'projects', projId, 'worklogs'),
        where('projectId', '==', projId)
      );
      unsubWorklogs = onSnapshot(
        worklogsQuery,
        (snapshot) => {
          const loaded: AppWorklog[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              projectId: String(data.projectId),
              projectOwnerId: String(data.projectOwnerId),
              freelancerId: String(data.freelancerId),
              freelancerName: String(data.freelancerName),
              hours: Number(data.hours),
              commitHash: String(data.commitHash),
              branchName: String(data.branchName),
              commitMessage: String(data.commitMessage),
              createdAtIso: formatTimestampToIso(data.createdAt),
            };
          });
          setWorklogsByProject((prev) => ({ ...prev, [projId]: loaded }));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, `projects/${projId}/worklogs`);
        }
      );
    } else {
      setWorklogsByProject((prev) => ({ ...prev, [projId]: [] }));
    }

    let unsubMessages = () => {};
    if (isOwner || isAssignedFreelancer || isOpenProject) {
      const messagesQuery = query(
        collection(db, 'projects', projId, 'messages'),
        where('projectId', '==', projId)
      );
      unsubMessages = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const loaded: AppChatMessage[] = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                projectId: String(data.projectId),
                projectOwnerId: String(data.projectOwnerId),
                senderId: String(data.senderId),
                senderName: String(data.senderName),
                text: String(data.text),
                createdAtIso: formatTimestampToIso(data.createdAt),
              };
            })
            .sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
          setMessagesByProject((prev) => ({ ...prev, [projId]: loaded }));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, `projects/${projId}/messages`);
        }
      );
    } else {
      setMessagesByProject((prev) => ({ ...prev, [projId]: [] }));
    }

    const reviewsQuery = query(
      collection(db, 'projects', projId, 'reviews'),
      where('projectId', '==', projId)
    );
    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const loaded: AppReview[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            projectId: String(data.projectId),
            projectOwnerId: String(data.projectOwnerId),
            reviewerId: String(data.reviewerId),
            reviewerName: String(data.reviewerName),
            targetUserId: String(data.targetUserId),
            rating: Number(data.rating),
            codeQualityScore: Number(data.codeQualityScore),
            communicationScore: Number(data.communicationScore),
            comment: String(data.comment),
            createdAtIso: formatTimestampToIso(data.createdAt),
          };
        });
        setReviewsByProject((prev) => ({ ...prev, [projId]: loaded }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `projects/${projId}/reviews`);
      }
    );

    return () => {
      unsubBids();
      unsubWorklogs();
      unsubMessages();
      unsubReviews();
    };
  }, [
    authReady,
    firebaseUser,
    selectedProject?.id,
    selectedProject?.ownerId,
    selectedProject?.assignedFreelancerId,
    selectedProject?.status,
  ]);

  const allWorklogs = useMemo(
    () => Object.values(worklogsByProject).flat(),
    [worklogsByProject]
  );
  const allReviews = useMemo(
    () => Object.values(reviewsByProject).flat(),
    [reviewsByProject]
  );

  const metricsSummary = useMemo(() => {
    const totalEscrowBrl = projects
      .filter((p) => p.escrowStatus === 'funded' || p.escrowStatus === 'released')
      .reduce((acc, p) => acc + p.budget, 0);
    const totalHours = allWorklogs.reduce((acc, w) => acc + w.hours, 0);
    const totalCommits = allWorklogs.length;
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
        : 0;

    return {
      totalEscrowBrl,
      totalHours,
      totalCommits,
      averageRating,
    };
  }, [projects, allWorklogs, allReviews]);

  const currentBids = bidsByProject[selectedProject?.id || ''] || [];
  const currentWorklogs = worklogsByProject[selectedProject?.id || ''] || [];
  const currentMessages = messagesByProject[selectedProject?.id || ''] || [];
  const currentReviews = reviewsByProject[selectedProject?.id || ''] || [];

  const createProject = useCallback(
    async (
      currentUser: ActiveUserProfileData,
      payload: {
        title: string;
        description: string;
        category: AppProject['category'];
        budget: number;
        deadlineDays: number;
        repoUrl: string;
      }
    ): Promise<string> => {
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
      setSelectedProjectId(projectId);
      return projectId;
    },
    []
  );

  const submitBid = useCallback(
    async (
      project: AppProject,
      currentUser: ActiveUserProfileData,
      payload: { amount: number; deliveryDays: number; pitch: string }
    ): Promise<string> => {
      const bidId = `bid_${Date.now()}`;
      try {
        await setDoc(doc(db, 'projects', project.id, 'bids', bidId), {
          projectId: project.id,
          projectOwnerId: project.ownerId,
          freelancerId: currentUser.uid,
          freelancerName: currentUser.displayName.slice(0, 80),
          freelancerSpecialty: (currentUser.specialty || 'Especialista').slice(0, 100),
          amount: payload.amount,
          deliveryDays: payload.deliveryDays,
          pitch: payload.pitch,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.CREATE,
          `projects/${project.id}/bids/${bidId}`
        );
      }
      return bidId;
    },
    []
  );

  const logWorklog = useCallback(
    async (
      project: AppProject,
      currentUser: ActiveUserProfileData,
      payload: {
        hours: number;
        commitHash: string;
        branchName: string;
        commitMessage: string;
      }
    ): Promise<string> => {
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
    },
    []
  );

  const sendChatMessage = useCallback(
    async (
      project: AppProject,
      currentUser: ActiveUserProfileData,
      text: string
    ): Promise<string> => {
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
    },
    []
  );

  const submitReview = useCallback(
    async (
      project: AppProject,
      currentUser: ActiveUserProfileData,
      payload: {
        rating: number;
        codeQualityScore: number;
        communicationScore: number;
        comment: string;
      }
    ): Promise<string> => {
      const revId = `rev_${Date.now()}`;
      const targetId =
        currentUser.uid === project.ownerId
          ? project.assignedFreelancerId || project.ownerId
          : project.ownerId;

      try {
        await setDoc(doc(db, 'projects', project.id, 'reviews', revId), {
          projectId: project.id,
          projectOwnerId: project.ownerId,
          reviewerId: currentUser.uid,
          reviewerName: currentUser.displayName.slice(0, 80),
          targetUserId: targetId,
          rating: payload.rating,
          codeQualityScore: payload.codeQualityScore,
          communicationScore: payload.communicationScore,
          comment: payload.comment.slice(0, 1000),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.CREATE,
          `projects/${project.id}/reviews/${revId}`
        );
      }
      return revId;
    },
    []
  );

  return {
    isProjectsSyncing,
    triggerInitialSync,
    specialists,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    bidsByProject,
    worklogsByProject,
    messagesByProject,
    reviewsByProject,
    currentBids,
    currentWorklogs,
    currentMessages,
    currentReviews,
    allWorklogs,
    allReviews,
    metricsSummary,
    hydrateOfflineSnapshot,
    resetUserCollections,
    createProject,
    submitBid,
    logWorklog,
    sendChatMessage,
    submitReview,
  };
}
