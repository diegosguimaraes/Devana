import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config.ts';

export const logger = pino({
  level: config.nodeEnv === 'test' ? 'silent' : config.logLevel,
  base: {
    service: 'devana-api',
    env: config.nodeEnv,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.body.encryptedPiiPayload',
      'req.body.ciphertextBase64',
      'req.body.ivBase64',
      'req.body.integrityHmac',
      '*.token',
      '*.idToken',
      '*.password',
      '*.passphrase',
      '*.backupHmacKey',
      '*.email',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function extractOrGenerateRequestId(
  req: IncomingMessage,
  res?: ServerResponse
): string {
  const existingHeader = req.headers['x-request-id'];
  const candidate = Array.isArray(existingHeader) ? existingHeader[0] : existingHeader;
  const requestId =
    typeof candidate === 'string' &&
    candidate.trim().length > 0 &&
    candidate.trim().length <= 128 &&
    /^[a-zA-Z0-9_\-.:]+$/.test(candidate.trim())
      ? candidate.trim()
      : crypto.randomUUID();

  if (res && !res.headersSent) {
    res.setHeader('X-Request-Id', requestId);
  }
  return requestId;
}

export function requestIdMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  extractOrGenerateRequestId(req, res);
  next();
}

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => extractOrGenerateRequestId(req, res),
  autoLogging: {
    ignore: (req) => {
      const target =
        (req as IncomingMessage & { originalUrl?: string }).originalUrl || req.url || '';
      return !target.startsWith('/api');
    },
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) =>
    `${req.method || 'GET'} ${req.url || '/'} -> ${res.statusCode}`,
  customErrorMessage: (req, res) =>
    `${req.method || 'GET'} ${req.url || '/'} -> ${res.statusCode}`,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: typeof req.url === 'string' ? req.url.split('?')[0] : '/',
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
