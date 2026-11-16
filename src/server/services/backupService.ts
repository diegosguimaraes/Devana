import crypto from 'node:crypto';
import { AppError } from '../errors.ts';
import {
  type StoredEncryptedBackup,
  vaultRepository,
} from '../repositories/vaultRepository.ts';

export interface CloudBackupInput {
  backupId: string;
  ownerUid: string;
  algorithm: 'AES-256-GCM';
  ivBase64: string;
  ciphertextBase64: string;
  recordCount: number;
}

export function syncEncryptedBackup(input: CloudBackupInput, authenticatedUid: string) {
  if (input.ownerUid !== authenticatedUid) {
    throw new AppError({
      status: 403,
      code: 'FORBIDDEN_BACKUP_OWNER',
      message: 'Permissão negada para gravar backup de outro usuário.',
      nextStep: 'Use sua própria conta autenticada.',
    });
  }

  const hmacSecret = vaultRepository.getBackupHmacKey();
  const integrityHmac = crypto
    .createHmac('sha256', hmacSecret)
    .update(
      `${input.backupId}:${input.ownerUid}:${input.ivBase64}:${input.ciphertextBase64}`
    )
    .digest('hex');

  const entry: StoredEncryptedBackup = {
    backupId: input.backupId,
    ownerUid: input.ownerUid,
    algorithm: input.algorithm,
    ivBase64: input.ivBase64,
    ciphertextBase64: input.ciphertextBase64,
    recordCount: input.recordCount,
    storedAtIso: new Date().toISOString(),
    integrityHmac,
  };

  vaultRepository.saveBackup(input.ownerUid, entry);

  return {
    backupId: entry.backupId,
    algorithm: entry.algorithm,
    recordCount: entry.recordCount,
    storedAtIso: entry.storedAtIso,
    integrityHmac: entry.integrityHmac,
  };
}

export function listUserBackups(ownerUid: string, authenticatedUid: string) {
  if (ownerUid !== authenticatedUid) {
    throw new AppError({
      status: 403,
      code: 'FORBIDDEN_BACKUP_OWNER',
      message: 'Acesso negado aos backups deste usuário.',
      nextStep: 'Consulte apenas os backups pertencentes à sua conta.',
    });
  }

  const list = vaultRepository.listBackupsByOwner(ownerUid);
  return list.map((b) => ({
    backupId: b.backupId,
    algorithm: b.algorithm,
    recordCount: b.recordCount,
    storedAtIso: b.storedAtIso,
    integrityHmac: b.integrityHmac,
  }));
}
