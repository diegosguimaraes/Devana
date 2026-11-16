import crypto from 'node:crypto';
import { type StoredWebhook, vaultRepository } from '../repositories/vaultRepository.ts';

export interface RegisterWebhookInput {
  provider: 'github' | 'gitlab' | 'jira' | 'slack';
  repositoryOrChannel: string;
  events: Array<'push' | 'pull_request' | 'milestone_released' | 'bid_created'>;
}

export function registerWebhookForUser(input: RegisterWebhookInput, uid: string) {
  const hook: StoredWebhook = {
    id: `wh_${crypto.randomBytes(5).toString('hex')}`,
    ownerUid: uid,
    provider: input.provider,
    repositoryOrChannel: input.repositoryOrChannel,
    events: input.events,
    createdAtIso: new Date().toISOString(),
  };

  vaultRepository.saveWebhook(uid, hook);

  return {
    id: hook.id,
    provider: hook.provider,
    repositoryOrChannel: hook.repositoryOrChannel,
    events: hook.events,
    createdAtIso: hook.createdAtIso,
  };
}

export function listWebhooksForUser(uid: string) {
  return vaultRepository.listWebhooksByOwner(uid).map((hook) => ({
    id: hook.id,
    provider: hook.provider,
    repositoryOrChannel: hook.repositoryOrChannel,
    events: hook.events,
    createdAtIso: hook.createdAtIso,
  }));
}
