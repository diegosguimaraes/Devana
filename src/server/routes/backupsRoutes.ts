import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { type AuthenticatedRequest, requireFirebaseAuth } from '../middlewares/auth.ts';
import { strictAuthLimiter } from '../middlewares/rateLimit.ts';
import { type ValidatedRequest, validate } from '../middlewares/validate.ts';
import { listUserBackups, syncEncryptedBackup } from '../services/backupService.ts';

const CloudBackupSchema = z
  .object({
    backupId: z.string().regex(/^[a-zA-Z0-9_-]{4,64}$/),
    ownerUid: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
    algorithm: z.literal('AES-256-GCM'),
    ivBase64: z.string().min(12).max(64),
    ciphertextBase64: z.string().min(16).max(150000),
    recordCount: z.number().int().min(0).max(10000),
  })
  .strict();

const OwnerUidParamsSchema = z
  .object({
    ownerUid: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_-]{1,128}$/),
  })
  .strict();

type CloudBackupBody = z.infer<typeof CloudBackupSchema>;
type OwnerUidParams = z.infer<typeof OwnerUidParamsSchema>;

export const backupsRouter = Router();

backupsRouter.post(
  '/cloud-sync',
  strictAuthLimiter,
  requireFirebaseAuth,
  validate({
    body: CloudBackupSchema,
    message: 'Payload de backup criptografado inválido.',
    nextStep: 'Gere o pacote criptografado AES-256-GCM novamente.',
  }),
  (
    req: AuthenticatedRequest & ValidatedRequest<CloudBackupBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = syncEncryptedBackup(req.validated!.body, req.authUid || '');
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
);

backupsRouter.get(
  '/cloud-sync/:ownerUid',
  requireFirebaseAuth,
  validate({
    params: OwnerUidParamsSchema,
    message: 'Identificador de usuário inválido.',
    nextStep: 'Informe um UID válido para consultar seus backups.',
  }),
  (
    req: AuthenticatedRequest & ValidatedRequest<unknown, unknown, OwnerUidParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const backups = listUserBackups(req.validated!.params.ownerUid, req.authUid || '');
      return res.json({ backups });
    } catch (err) {
      return next(err);
    }
  }
);
