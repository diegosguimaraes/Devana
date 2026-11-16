import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { type AuthenticatedRequest, requireFirebaseAuth } from '../middlewares/auth.ts';
import { type ValidatedRequest, validate } from '../middlewares/validate.ts';
import {
  listWebhooksForUser,
  registerWebhookForUser,
} from '../services/webhookService.ts';

const ThirdPartyWebhookSchema = z
  .object({
    provider: z.enum(['github', 'gitlab', 'jira', 'slack']),
    repositoryOrChannel: z
      .string()
      .min(2)
      .max(120)
      .regex(/^[a-zA-Z0-9_.\-/]+$/),
    events: z
      .array(z.enum(['push', 'pull_request', 'milestone_released', 'bid_created']))
      .min(1)
      .max(4),
  })
  .strict();

type WebhookBody = z.infer<typeof ThirdPartyWebhookSchema>;

export const integrationsRouter = Router();

integrationsRouter.post(
  '/webhooks',
  requireFirebaseAuth,
  validate({
    body: ThirdPartyWebhookSchema,
    message: 'Configuração de webhook inválida.',
    nextStep: 'Verifique o nome do repositório/canal e selecione ao menos um evento.',
  }),
  (req: AuthenticatedRequest & ValidatedRequest<WebhookBody>, res: Response) => {
    const webhook = registerWebhookForUser(req.validated!.body, req.authUid || 'unknown');
    return res.json({ webhook });
  }
);

integrationsRouter.get(
  '/webhooks',
  requireFirebaseAuth,
  (req: AuthenticatedRequest, res: Response) => {
    const webhooks = listWebhooksForUser(req.authUid || 'unknown');
    return res.json({ webhooks });
  }
);
