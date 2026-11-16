export type WebhookProvider = 'github' | 'gitlab' | 'jira' | 'slack';

export interface UploadCheckResult {
  ok: boolean;
  message: string;
  detail?: string;
}

export interface WebhookItem {
  id: string;
  provider: string;
  repositoryOrChannel: string;
  events: string[];
  createdAtIso: string;
}

export interface PrivateSettingsPayload {
  encryptedPiiPayload: string;
  pushNotificationsEnabled: boolean;
  notifyOnBid: boolean;
  notifyOnMessage: boolean;
  notifyOnEscrow: boolean;
}
