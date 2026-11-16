import crypto from 'node:crypto';
import { AppError } from '../errors.ts';

export type AllowedUploadMime =
  'application/pdf' | 'image/png' | 'image/jpeg' | 'text/csv';

export interface VerifyUploadInput {
  originalName: string;
  declaredMimeType: AllowedUploadMime;
  sizeBytes: number;
  magicHexPrefix: string;
}

export function getSecurityPosture() {
  return {
    rlsEnabled: true,
    piiEncryption: 'AES-256-GCM',
    passwordHashing: 'Argon2id / Firebase Scrypt',
    rateLimitingActive: true,
    strictSchemaValidation: 'Zod .strict()',
    helmetCspActive: true,
    corsWhitelistActive: true,
    structuredLogging: 'pino',
    escrowLedgerAppendOnly: true,
    securityHeaders: [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'X-Request-Id',
    ],
    commissionRatePercent: 0,
  };
}

export function verifyFileMagicSignature(input: VerifyUploadInput) {
  const upperHex = input.magicHexPrefix.toUpperCase();

  let magicValid = false;
  if (input.declaredMimeType === 'application/pdf' && upperHex.startsWith('25504446')) {
    magicValid = true;
  } else if (input.declaredMimeType === 'image/png' && upperHex.startsWith('89504E47')) {
    magicValid = true;
  } else if (input.declaredMimeType === 'image/jpeg' && upperHex.startsWith('FFD8FF')) {
    magicValid = true;
  } else if (input.declaredMimeType === 'text/csv') {
    magicValid = true;
  }

  if (!magicValid) {
    throw new AppError({
      status: 415,
      code: 'UNSUPPORTED_MEDIA_SIGNATURE',
      message:
        'Assinatura binária (Magic Numbers) incompatível com o tipo MIME declarado.',
      nextStep:
        'Não renomeie executáveis ou outros formatos. Envie um arquivo autêntico.',
    });
  }

  const extMap: Record<AllowedUploadMime, string> = {
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'text/csv': '.csv',
  };

  return {
    verified: true,
    safeStorageName: `vault_${crypto.randomUUID()}${extMap[input.declaredMimeType]}`,
    storageZone: '/var/devana-private-vault/attachments/',
    sizeBytes: input.sizeBytes,
  };
}
