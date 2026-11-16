/**
 * User-Scoped Offline Sync Vault
 * Caches real Firestore snapshots per authenticated UID for offline resiliency.
 */

const OFFLINE_VAULT_PREFIX = 'devana_offline_vault_v2_';

export interface OfflineVaultSnapshot<TProject, TBid, TWorklog, TMessage, TReview> {
  updatedAtIso: string;
  projects: TProject[];
  bidsByProject: Record<string, TBid[]>;
  worklogsByProject: Record<string, TWorklog[]>;
  messagesByProject: Record<string, TMessage[]>;
  reviewsByProject: Record<string, TReview[]>;
}

export function saveOfflineSnapshot<TProject, TBid, TWorklog, TMessage, TReview>(
  uid: string,
  snapshot: OfflineVaultSnapshot<TProject, TBid, TWorklog, TMessage, TReview>
): void {
  if (!uid) return;
  try {
    localStorage.setItem(`${OFFLINE_VAULT_PREFIX}${uid}`, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadOfflineSnapshot<TProject, TBid, TWorklog, TMessage, TReview>(
  uid: string
): OfflineVaultSnapshot<TProject, TBid, TWorklog, TMessage, TReview> | null {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(`${OFFLINE_VAULT_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineVaultSnapshot<
      TProject,
      TBid,
      TWorklog,
      TMessage,
      TReview
    >;
  } catch {
    return null;
  }
}

export function clearOfflineSnapshot(uid?: string): void {
  try {
    if (uid) {
      localStorage.removeItem(`${OFFLINE_VAULT_PREFIX}${uid}`);
    }
    localStorage.removeItem('devana_offline_vault_v1');
  } catch {
    // Ignore storage errors
  }
}
