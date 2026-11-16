import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors.ts';
import { type AuthenticatedRequest, requireFirebaseAuth } from '../middlewares/auth.ts';
import { strictEscrowLimiter } from '../middlewares/rateLimit.ts';
import { type ValidatedRequest, validate } from '../middlewares/validate.ts';
import {
  appendEscrowLedgerAuditEntry,
  listEscrowLedgerForParticipant,
} from '../services/escrowService.ts';

const SafeIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_\-:]+$/);

const EscrowLedgerCreateSchema = z
  .object({
    projectId: SafeIdSchema,
    projectOwnerId: SafeIdSchema,
    freelancerId: SafeIdSchema,
    state: z.enum(['pending', 'in_escrow', 'released', 'refunded']),
    amount: z.number().positive().max(10_000_000),
    idempotencyKey: SafeIdSchema.min(8).optional(),
  })
  .strict();

const ProjectIdParamsSchema = z.object({
  projectId: SafeIdSchema,
});

type EscrowLedgerBody = z.infer<typeof EscrowLedgerCreateSchema>;
type ProjectIdParams = z.infer<typeof ProjectIdParamsSchema>;

export const escrowRouter = Router();

escrowRouter.get(
  '/ledger/:projectId',
  requireFirebaseAuth,
  validate({
    params: ProjectIdParamsSchema,
    message: 'Identificador de projeto inválido na consulta de custódia.',
    nextStep: 'Informe um ID de projeto válido.',
  }),
  (
    req: AuthenticatedRequest & ValidatedRequest<unknown, unknown, ProjectIdParams>,
    res: Response
  ) => {
    const entries = listEscrowLedgerForParticipant(
      req.validated!.params.projectId,
      req.authUid!
    );
    return res.json({
      projectId: req.validated!.params.projectId,
      entries,
      commissionRatePercent: 0,
    });
  }
);

escrowRouter.post(
  '/ledger',
  requireFirebaseAuth,
  strictEscrowLimiter,
  validate({
    body: EscrowLedgerCreateSchema,
    message: 'Dados inválidos para registro no livro de custódia Escrow.',
    nextStep:
      'Verifique estado (pending, in_escrow, released ou refunded), valor e chave de idempotência.',
  }),
  (
    req: AuthenticatedRequest & ValidatedRequest<EscrowLedgerBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.authEmailVerified) {
        throw new AppError({
          status: 403,
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Verifique seu e-mail antes de registrar movimentações financeiras.',
          nextStep: 'Confirme seu e-mail no painel da conta e tente novamente.',
        });
      }

      const headerKey = req.headers['x-idempotency-key'];
      const rawHeaderKey = typeof headerKey === 'string' ? headerKey.trim() : '';
      const idempotencyKey = req.validated!.body.idempotencyKey || rawHeaderKey;

      if (
        !idempotencyKey ||
        idempotencyKey.length < 8 ||
        idempotencyKey.length > 128 ||
        !/^[a-zA-Z0-9_\-:]+$/.test(idempotencyKey)
      ) {
        throw new AppError({
          status: 400,
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: 'Chave de idempotência obrigatória para operações de custódia.',
          nextStep:
            'Envie X-Idempotency-Key (8–128 chars alfanuméricos) no cabeçalho ou payload.',
        });
      }

      const result = appendEscrowLedgerAuditEntry({
        projectId: req.validated!.body.projectId,
        projectOwnerId: req.validated!.body.projectOwnerId,
        freelancerId: req.validated!.body.freelancerId,
        actorUid: req.authUid!,
        state: req.validated!.body.state,
        amount: req.validated!.body.amount,
        idempotencyKey,
      });

      return res.status(result.idempotentReplay ? 200 : 201).json(result);
    } catch (err) {
      return next(err);
    }
  }
);
