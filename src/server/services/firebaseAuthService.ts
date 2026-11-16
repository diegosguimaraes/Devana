import crypto from 'node:crypto';
import { config } from '../config.ts';

export interface VerifiedFirebaseIdentity {
  uid: string;
  emailVerified: boolean;
  displayName?: string;
}

interface CachedTokenIdentity {
  identity: VerifiedFirebaseIdentity;
  expiresAt: number;
}

export type TokenVerificationResult =
  | { ok: true; identity: VerifiedFirebaseIdentity }
  | { ok: false; status: number; code: string; error: string; nextStep: string };

const verifiedTokenCache = new Map<string, CachedTokenIdentity>();

export async function verifyFirebaseIdToken(
  token: string
): Promise<TokenVerificationResult> {
  if (!token || token.length < 20 || token.length > 4096) {
    return {
      ok: false,
      status: 401,
      code: 'AUTH_INVALID_TOKEN',
      error: 'Token de autenticação inválido.',
      nextStep: 'Renove sua sessão fazendo login novamente.',
    };
  }

  const { apiKey } = config.firebase;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      code: 'AUTH_NOT_CONFIGURED',
      error: 'Serviço de verificação de identidade não configurado.',
      nextStep:
        'Verifique a presença do firebase-applet-config.json ou FIREBASE_API_KEY.',
    };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const cached = verifiedTokenCache.get(tokenHash);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, identity: cached.identity };
  }

  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!verifyRes.ok) {
      return {
        ok: false,
        status: 401,
        code: 'AUTH_TOKEN_EXPIRED',
        error: 'Token Firebase expirado ou inválido.',
        nextStep: 'Faça login novamente para renovar sua credencial.',
      };
    }

    const payload = (await verifyRes.json()) as {
      users?: Array<{
        localId?: string;
        emailVerified?: boolean;
        disabled?: boolean;
        displayName?: string;
      }>;
    };

    const account = payload.users?.[0];
    if (!account?.localId || account.disabled) {
      return {
        ok: false,
        status: 401,
        code: 'AUTH_ACCOUNT_DISABLED',
        error: 'Conta de usuário não encontrada ou desativada.',
        nextStep: 'Acesse com uma conta ativa.',
      };
    }

    if (account.emailVerified !== true) {
      return {
        ok: false,
        status: 403,
        code: 'AUTH_EMAIL_UNVERIFIED',
        error: 'E-mail ainda não verificado.',
        nextStep: 'Confirme o link de verificação enviado para sua caixa de entrada.',
      };
    }

    const identity: VerifiedFirebaseIdentity = {
      uid: account.localId,
      emailVerified: true,
      displayName: account.displayName,
    };

    if (verifiedTokenCache.size > 500) {
      verifiedTokenCache.clear();
    }
    verifiedTokenCache.set(tokenHash, {
      identity,
      expiresAt: Date.now() + 45_000,
    });

    return { ok: true, identity };
  } catch {
    return {
      ok: false,
      status: 502,
      code: 'AUTH_PROVIDER_UNAVAILABLE',
      error: 'Não foi possível validar sua credencial no Firebase Auth.',
      nextStep: 'Verifique a conexão do servidor e tente novamente em instantes.',
    };
  }
}
