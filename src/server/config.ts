import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '../..');

interface FirebaseAppletConfigFile {
  apiKey?: string;
  projectId?: string;
  firestoreDatabaseId?: string;
}

function readFirebaseConfigFile(): FirebaseAppletConfigFile {
  const configPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as FirebaseAppletConfigFile;
  } catch {
    return {};
  }
}

function normalizeOrigin(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATA_DIR: z.string().trim().min(1).optional(),
  APP_URL: z.string().trim().optional(),
  ALLOWED_ORIGINS: z.string().trim().optional(),
  STRICT_FRAME_DENY: z.enum(['true', 'false']).optional(),
  BACKUP_HMAC_KEY: z.string().trim().optional(),
  REDIS_URL: z.string().trim().optional(),
  FIREBASE_API_KEY: z.string().trim().optional(),
  FIREBASE_PROJECT_ID: z.string().trim().optional(),
  FIREBASE_DATABASE_ID: z.string().trim().optional(),
});

const FirebaseConfigSchema = z.object({
  apiKey: z.string().trim().min(10, 'FIREBASE_API_KEY ausente ou inválida.'),
  projectId: z.string().trim().min(2, 'FIREBASE_PROJECT_ID ausente ou inválido.'),
  firestoreDatabaseId: z.string().trim().min(1).default('(default)'),
});

export interface ServerConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  dataDir: string;
  vaultFile: string;
  hmacKeyFile: string;
  backupHmacKey: string | null;
  allowedOrigins: string[];
  strictFrameDeny: boolean;
  redisUrl: string | null;
  firebase: {
    apiKey: string;
    projectId: string;
    firestoreDatabaseId: string;
  };
}

function loadServerConfig(): ServerConfig {
  const envParsed = EnvSchema.safeParse(process.env);
  if (!envParsed.success) {
    const issues = envParsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`[Devana Config Error] Variáveis de ambiente inválidas: ${issues}`);
  }

  const isTestEnv = envParsed.data.NODE_ENV === 'test' || Boolean(process.env.VITEST);

  const fileFirebase = readFirebaseConfigFile();
  const firebaseParsed = FirebaseConfigSchema.safeParse({
    apiKey:
      envParsed.data.FIREBASE_API_KEY ||
      fileFirebase.apiKey ||
      (isTestEnv ? 'test-placeholder-api-key' : ''),
    projectId:
      envParsed.data.FIREBASE_PROJECT_ID ||
      fileFirebase.projectId ||
      (isTestEnv ? 'devana-test-project' : ''),
    firestoreDatabaseId:
      envParsed.data.FIREBASE_DATABASE_ID ||
      fileFirebase.firestoreDatabaseId ||
      '(default)',
  });

  if (!firebaseParsed.success) {
    const issues = firebaseParsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(
      `[Devana Config Error] Configuração Firebase obrigatória ausente (${issues}). Forneça FIREBASE_API_KEY/FIREBASE_PROJECT_ID ou firebase-applet-config.json local.`
    );
  }

  const rawHmac = envParsed.data.BACKUP_HMAC_KEY;
  if (rawHmac && rawHmac.length > 0 && rawHmac.length < 16) {
    throw new Error(
      '[Devana Config Error] BACKUP_HMAC_KEY deve ter ao menos 16 caracteres quando definida.'
    );
  }

  const port = envParsed.data.PORT;
  const originsSet = new Set<string>([
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ]);

  if (envParsed.data.APP_URL) {
    const parsedAppOrigin = normalizeOrigin(envParsed.data.APP_URL);
    if (parsedAppOrigin) {
      originsSet.add(parsedAppOrigin);
    }
  }

  if (envParsed.data.ALLOWED_ORIGINS) {
    for (const part of envParsed.data.ALLOWED_ORIGINS.split(',')) {
      const normalized = normalizeOrigin(part);
      if (normalized) {
        originsSet.add(normalized);
      }
    }
  }

  const dataDir = path.resolve(envParsed.data.DATA_DIR || path.join(ROOT_DIR, 'data'));

  const strictFrameDeny =
    envParsed.data.STRICT_FRAME_DENY === 'true' ||
    (envParsed.data.NODE_ENV === 'production' &&
      envParsed.data.STRICT_FRAME_DENY !== 'false');

  return {
    nodeEnv: envParsed.data.NODE_ENV,
    port,
    logLevel: envParsed.data.LOG_LEVEL,
    dataDir,
    vaultFile: path.join(dataDir, 'server-vault.json'),
    hmacKeyFile: path.join(dataDir, 'vault.hmac.key'),
    backupHmacKey: rawHmac && rawHmac.length >= 16 ? rawHmac : null,
    allowedOrigins: Array.from(originsSet),
    strictFrameDeny,
    redisUrl: envParsed.data.REDIS_URL || null,
    firebase: firebaseParsed.data,
  };
}

export const config: ServerConfig = loadServerConfig();
