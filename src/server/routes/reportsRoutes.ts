import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { type AuthenticatedRequest, requireFirebaseAuth } from '../middlewares/auth.ts';
import { strictAuthLimiter } from '../middlewares/rateLimit.ts';
import { type ValidatedRequest, validate } from '../middlewares/validate.ts';
import { dispatchEmailReport } from '../services/reportService.ts';

const ShareReportSchema = z
  .object({
    recipientEmail: z.string().email().max(160),
    projectTitle: z.string().min(2).max(140),
    totalHours: z.number().min(0).max(100000),
    totalCommits: z.number().int().min(0).max(100000),
    escrowTotalBrl: z.number().min(0).max(100000000),
    checksumSha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  })
  .strict();

type ShareReportBody = z.infer<typeof ShareReportSchema>;

export const reportsRouter = Router();

reportsRouter.post(
  '/share-email',
  strictAuthLimiter,
  requireFirebaseAuth,
  validate({
    body: ShareReportSchema,
    message: 'Dados do relatório inválidos ou campos extras não permitidos.',
    nextStep: 'Verifique o e-mail de destino e tente enviar novamente.',
  }),
  (req: AuthenticatedRequest & ValidatedRequest<ShareReportBody>, res: Response) => {
    const result = dispatchEmailReport(req.validated!.body, req.authUid || 'unknown');
    return res.json(result);
  }
);
