import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { config } from './config.ts';
import { AppError } from './errors.ts';
import { httpLogger, requestIdMiddleware } from './logger.ts';
import { apiNotFoundHandler, errorHandler } from './middlewares/errorHandler.ts';
import { globalApiLimiter } from './middlewares/rateLimit.ts';
import { apiRouter } from './routes/index.ts';

function isOriginPermitted(origin: string): boolean {
  if (config.allowedOrigins.includes(origin)) {
    return true;
  }

  if (config.nodeEnv !== 'production') {
    try {
      const parsed = new URL(origin);
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.run.app') ||
        parsed.hostname.endsWith('.aistudio.google.com')
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(requestIdMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc:
            config.nodeEnv === 'production'
              ? ["'self'", 'https://apis.google.com', 'https://www.gstatic.com']
              : [
                  "'self'",
                  "'unsafe-inline'",
                  'https://apis.google.com',
                  'https://www.gstatic.com',
                ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://*.googleusercontent.com',
            'https://avatars.githubusercontent.com',
          ],
          connectSrc: [
            "'self'",
            'wss:',
            'ws:',
            'https://*.googleapis.com',
            'https://identitytoolkit.googleapis.com',
            'https://securetoken.googleapis.com',
            'https://firestore.googleapis.com',
            'https://api.github.com',
          ],
          frameSrc: [
            "'self'",
            'https://*.firebaseapp.com',
            'https://accounts.google.com',
          ],
          frameAncestors: config.strictFrameDeny
            ? ["'none'"]
            : ["'self'", 'https://aistudio.google.com', 'https://*.aistudio.google.com'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          ...(config.nodeEnv === 'production' ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      strictTransportSecurity: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xFrameOptions: config.strictFrameDeny ? { action: 'deny' } : false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isOriginPermitted(origin)) {
          return callback(null, true);
        }
        return callback(
          new AppError({
            status: 403,
            code: 'CORS_ORIGIN_DENIED',
            message: 'Origem não autorizada pela política CORS.',
            nextStep: 'Configure ALLOWED_ORIGINS no servidor para incluir esta origem.',
          })
        );
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-Id',
        'X-Idempotency-Key',
      ],
      exposedHeaders: ['X-Request-Id', 'Retry-After'],
    })
  );

  app.use(express.json({ limit: '250kb' }));
  app.use('/api', httpLogger);
  app.use('/api', globalApiLimiter);
  app.use('/api', apiRouter);
  app.use('/api', apiNotFoundHandler);
  app.use(errorHandler);

  return app;
}
