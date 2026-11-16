import { apiClient } from '../../../lib';
import type { CloudSyncBackupPayload, ShareReportEmailPayload } from '../types';

export async function shareReportByEmailApi(payload: ShareReportEmailPayload) {
  return apiClient.post<{ recipientEmail: string; dispatchId: string }>(
    '/api/reports/share-email',
    payload,
    { auth: true }
  );
}

export async function syncEncryptedBackupApi(payload: CloudSyncBackupPayload) {
  return apiClient.post<{ storedAtIso?: string; integrityHmac?: string }>(
    '/api/backups/cloud-sync',
    payload,
    { auth: true }
  );
}
