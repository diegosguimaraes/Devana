export interface EncryptedBackupRecord {
  backupId: string;
  combinedToken: string;
  storedAtIso: string;
  recordCount: number;
  integrityHmac?: string;
}

export interface ShareReportEmailPayload {
  recipientEmail: string;
  projectTitle: string;
  totalHours: number;
  totalCommits: number;
  escrowTotalBrl: number;
  checksumSha256: string;
}

export interface CloudSyncBackupPayload {
  backupId: string;
  ownerUid: string;
  algorithm: 'AES-256-GCM';
  ivBase64: string;
  ciphertextBase64: string;
  recordCount: number;
}
