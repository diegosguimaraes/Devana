import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from '../config.ts';
import { logger } from '../logger.ts';

export interface StoredEncryptedBackup {
  backupId: string;
  ownerUid: string;
  algorithm: 'AES-256-GCM';
  ivBase64: string;
  ciphertextBase64: string;
  recordCount: number;
  storedAtIso: string;
  integrityHmac: string;
}

export interface StoredWebhook {
  id: string;
  ownerUid: string;
  provider: string;
  repositoryOrChannel: string;
  events: string[];
  createdAtIso: string;
}

export type EscrowLedgerState = 'pending' | 'in_escrow' | 'released' | 'refunded';

export interface StoredEscrowLedgerEntry {
  entryId: string;
  projectId: string;
  projectOwnerId: string;
  freelancerId: string;
  actorUid: string;
  state: EscrowLedgerState;
  amount: number;
  commissionAmount: 0;
  idempotencyKey: string;
  previousHash: string;
  integrityHash: string;
  createdAtIso: string;
}

interface PersistentVaultState {
  backups: Record<string, StoredEncryptedBackup[]>;
  webhooks: Record<string, StoredWebhook[]>;
  escrowLedger?: Record<string, StoredEscrowLedgerEntry[]>;
}

const encryptedCloudBackups = new Map<string, StoredEncryptedBackup[]>();
const registeredWebhooks = new Map<string, StoredWebhook[]>();
const escrowLedgerByProject = new Map<string, StoredEscrowLedgerEntry[]>();

function ensureDataDir(): void {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

function loadVaultFromDisk(): void {
  try {
    ensureDataDir();
    if (!fs.existsSync(config.vaultFile)) return;
    const raw = fs.readFileSync(config.vaultFile, 'utf-8');
    const parsed = JSON.parse(raw) as PersistentVaultState;

    if (parsed.backups && typeof parsed.backups === 'object') {
      for (const [uid, items] of Object.entries(parsed.backups)) {
        if (Array.isArray(items)) {
          encryptedCloudBackups.set(uid, items);
        }
      }
    }
    if (parsed.webhooks && typeof parsed.webhooks === 'object') {
      for (const [uid, items] of Object.entries(parsed.webhooks)) {
        if (Array.isArray(items)) {
          registeredWebhooks.set(uid, items);
        }
      }
    }
    if (parsed.escrowLedger && typeof parsed.escrowLedger === 'object') {
      for (const [projectId, entries] of Object.entries(parsed.escrowLedger)) {
        if (Array.isArray(entries)) {
          escrowLedgerByProject.set(projectId, entries);
        }
      }
    }
  } catch (err) {
    logger.warn(
      { errorMessage: err instanceof Error ? err.message : String(err) },
      'Failed to restore server vault from disk'
    );
  }
}

function persistVaultToDisk(): void {
  try {
    ensureDataDir();
    const state: PersistentVaultState = {
      backups: Object.fromEntries(encryptedCloudBackups.entries()),
      webhooks: Object.fromEntries(registeredWebhooks.entries()),
      escrowLedger: Object.fromEntries(escrowLedgerByProject.entries()),
    };
    const tempPath = `${config.vaultFile}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), { mode: 0o600 });
    fs.renameSync(tempPath, config.vaultFile);
  } catch (err) {
    logger.error(
      { errorMessage: err instanceof Error ? err.message : String(err) },
      'Failed to persist server vault to disk'
    );
  }
}

loadVaultFromDisk();

export const vaultRepository = {
  getBackupHmacKey(): string {
    if (config.backupHmacKey) {
      return config.backupHmacKey;
    }
    ensureDataDir();
    if (fs.existsSync(config.hmacKeyFile)) {
      return fs.readFileSync(config.hmacKeyFile, 'utf-8').trim();
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(config.hmacKeyFile, generated, { mode: 0o600 });
    return generated;
  },

  listBackupsByOwner(ownerUid: string): StoredEncryptedBackup[] {
    return encryptedCloudBackups.get(ownerUid) || [];
  },

  saveBackup(ownerUid: string, entry: StoredEncryptedBackup): void {
    const existingList = encryptedCloudBackups.get(ownerUid) || [];
    encryptedCloudBackups.set(ownerUid, [entry, ...existingList.slice(0, 9)]);
    persistVaultToDisk();
  },

  listWebhooksByOwner(ownerUid: string): StoredWebhook[] {
    return registeredWebhooks.get(ownerUid) || [];
  },

  saveWebhook(ownerUid: string, hook: StoredWebhook): void {
    const current = registeredWebhooks.get(ownerUid) || [];
    registeredWebhooks.set(ownerUid, [hook, ...current.slice(0, 9)]);
    persistVaultToDisk();
  },

  listEscrowLedgerByProject(projectId: string): StoredEscrowLedgerEntry[] {
    return escrowLedgerByProject.get(projectId) || [];
  },

  findEscrowLedgerByIdempotencyKey(
    projectId: string,
    idempotencyKey: string
  ): StoredEscrowLedgerEntry | undefined {
    const entries = escrowLedgerByProject.get(projectId) || [];
    return entries.find((e) => e.idempotencyKey === idempotencyKey);
  },

  appendEscrowLedgerEntry(projectId: string, entry: StoredEscrowLedgerEntry): void {
    const current = escrowLedgerByProject.get(projectId) || [];
    // Append-only: preserve chronological immutable order without mutating prior rows
    escrowLedgerByProject.set(projectId, [...current, entry]);
    persistVaultToDisk();
  },
};
