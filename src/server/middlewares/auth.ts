import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors.ts';
import { verifyFirebaseIdToken } from '../services/firebaseAuthService.ts';

export interface AuthenticatedRequest extends Request {
  authUid?: string;
  authEmailVerified?: boolean;
}

export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError({
        status: 401,
        code: 'AUTH_REQUIRED',
        message: 'Autenticação obrigatória no servidor.',
        nextStep: 'Faça login com uma conta verificada antes de executar esta operação.',
      })
    );
  }

  const token = authHeader.slice(7).trim();
  const verification = await verifyFirebaseIdToken(token);
  if (!verification.ok) {
    return next(
      new AppError({
        status: verification.status,
        code: verification.code,
        message: verification.error,
        nextStep: verification.nextStep,
      })
    );
  }

  req.authUid = verification.identity.uid;
  req.authEmailVerified = verification.identity.emailVerified;
  return next();
}
