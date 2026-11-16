import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const localConfigModules = import.meta.glob<Partial<FirebaseClientConfig>>(
  '../firebase-applet-config.json',
  { eager: true, import: 'default' }
);
const localFileConfig = localConfigModules['../firebase-applet-config.json'] ?? {};

const firebaseConfig: FirebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localFileConfig.apiKey || '',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localFileConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localFileConfig.projectId || '',
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    localFileConfig.firestoreDatabaseId ||
    '(default)',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localFileConfig.storageBucket || '',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    localFileConfig.messagingSenderId ||
    '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localFileConfig.appId || '',
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const safeInitConfig: FirebaseClientConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: 'unconfigured-placeholder',
      authDomain: 'localhost',
      projectId: 'devana-unconfigured',
      firestoreDatabaseId: '(default)',
      appId: '1:000000000000:web:000000000000',
    };

const app = initializeApp(safeInitConfig);
export const db = getFirestore(app, safeInitConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Verbatim validation constants matching firebase-blueprint.json and firestore.rules
export const VALIDATION_CONSTANTS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  ID_MAX_LENGTH: 128,
  COMMIT_HASH_PATTERN: /^[a-fA-F0-9]+$/,
  COMMIT_HASH_MIN: 7,
  COMMIT_HASH_MAX: 40,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 80,
  SPECIALTY_MIN: 2,
  SPECIALTY_MAX: 100,
  BIO_MAX: 600,
  PROJECT_TITLE_MIN: 5,
  PROJECT_TITLE_MAX: 140,
  PROJECT_DESC_MIN: 10,
  PROJECT_DESC_MAX: 3000,
  BID_PITCH_MIN: 10,
  BID_PITCH_MAX: 1500,
  CHAT_TEXT_MIN: 1,
  CHAT_TEXT_MAX: 1000,
  REVIEW_COMMENT_MIN: 5,
  REVIEW_COMMENT_MAX: 1000,
} as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
