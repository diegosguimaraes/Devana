import type { NextFunction, Request, Response } from 'express';
import { buildErrorBody } from '../errors.ts';

interface RateBucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS_PER_STORE = 10_000;
const ipRateLimits = new Map<string, RateBucket>();
const authRateLimits = new Map<string, RateBucket>();
const escrowRateLimits = new Map<string, RateBucket>();

function pruneStore(store: Map<string, RateBucket>, now: number): void {
  if (store.size < 1000) return;

  for (const [key, bucket] of store.entries()) {
    if (now > bucket.resetAt) {
      store.delete(key);
    }
  }

  // Enforce strict upper bound on store size under IP flood conditions
  while (store.size >= MAX_BUCKETS_PER_STORE) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) break;
    store.delete(oldestKey);
  }
}

export function createRateLimiter(
  store: Map<string, RateBucket>,
  maxRequests: number,
  windowMs: number
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();
    pruneStore(store, now);

    const bucket = store.get(ip);
    if (!bucket || now > bucket.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json(
        buildErrorBody({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Limite de requisições excedido (Rate Limit).',
          nextStep: 'Aguarde alguns segundos antes de tentar novamente.',
        })
      );
    }

    bucket.count += 1;
    return next();
  };
}

export const globalApiLimiter = createRateLimiter(ipRateLimits, 90, 60_000);
export const strictAuthLimiter = createRateLimiter(authRateLimits, 12, 60_000);
export const strictEscrowLimiter = createRateLimiter(escrowRateLimits, 20, 60_000);
