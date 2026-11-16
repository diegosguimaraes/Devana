import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import { apiClient } from '../../../lib';
import type { PrivateSettingsPayload, WebhookItem, WebhookProvider } from '../types';

export async function fetchUserWebhooksApi(): Promise<WebhookItem[]> {
  const data = await apiClient.get<{ webhooks?: WebhookItem[] }>(
    '/api/integrations/webhooks',
    { auth: true }
  );
  return Array.isArray(data?.webhooks) ? data.webhooks : [];
}

export async function registerWebhookApi(payload: {
  provider: WebhookProvider;
  repositoryOrChannel: string;
  events: string[];
}): Promise<WebhookItem | null> {
  const data = await apiClient.post<{ webhook?: WebhookItem }>(
    '/api/integrations/webhooks',
    payload,
    { auth: true }
  );
  return data.webhook || null;
}

export async function verifyUploadMagicBytesApi(payload: {
  originalName: string;
  declaredMimeType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'text/csv';
  sizeBytes: number;
  magicHexPrefix: string;
}) {
  return apiClient.post<{ safeStorageName: string; storageZone: string }>(
    '/api/security/verify-upload',
    payload,
    { auth: true }
  );
}

export async function savePrivatePiiSettings(
  uid: string,
  payload: PrivateSettingsPayload
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'private', 'settings'), {
      ownerId: uid,
      encryptedPiiPayload: payload.encryptedPiiPayload,
      pushNotificationsEnabled: payload.pushNotificationsEnabled,
      notifyOnBid: payload.notifyOnBid,
      notifyOnMessage: payload.notifyOnMessage,
      notifyOnEscrow: payload.notifyOnEscrow,
      backupEndpointUrl: window.location.origin,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/private/settings`);
  }
}
