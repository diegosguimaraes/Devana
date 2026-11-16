import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { type AuthenticatedRequest, requireFirebaseAuth } from '../middlewares/auth.ts';
import { type ValidatedRequest, validate } from '../middlewares/validate.ts';
import {
  getSecurityPosture,
  verifyFileMagicSignature,
} from '../services/securityService.ts';

const FileUploadValidationSchema = z
  .object({
    originalName: z.string().min(1).max(120),
    declaredMimeType: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'text/csv']),
    sizeBytes: z
      .number()
      .int()
      .min(1)
      .max(5 * 1024 * 1024),
    magicHexPrefix: z.string().regex(/^[a-fA-F0-9]{8,16}$/),
  })
  .strict();

type FileUploadBody = z.infer<typeof FileUploadValidationSchema>;

export const securityRouter = Router();

securityRouter.get('/posture', (_req: Request, res: Response) => {
  return res.json(getSecurityPosture());
});

securityRouter.post(
  '/verify-upload',
  requireFirebaseAuth,
  validate({
    body: FileUploadValidationSchema,
    message: 'Arquivo rejeitado pelas regras de validação de tamanho ou tipo.',
    nextStep: 'Envie apenas arquivos PDF, PNG, JPEG ou CSV com até 5 MB.',
  }),
  (
    req: AuthenticatedRequest & ValidatedRequest<FileUploadBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = verifyFileMagicSignature(req.validated!.body);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
);
