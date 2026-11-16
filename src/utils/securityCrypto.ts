/**
 * Web Crypto API AES-256-GCM Encryption, SHA-256 Integrity & Magic-Byte File Inspector
 * Implements Security Directives #2.5 (PII & Backup Encryption) and #4.15 (File Upload Validation)
 */

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveAesGcmKey(passphrase: string, saltStr: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltStr),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPayloadAesGcm(
  plainObject: unknown,
  secretKeyMaterial: string
): Promise<{ ivBase64: string; ciphertextBase64: string; combinedToken: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesGcmKey(secretKeyMaterial, 'devana-salt-v1');
  const encoded = new TextEncoder().encode(JSON.stringify(plainObject));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const ivBase64 = bufferToBase64(iv.buffer);
  const ciphertextBase64 = bufferToBase64(encryptedBuffer);
  return {
    ivBase64,
    ciphertextBase64,
    combinedToken: `AES256GCM.${ivBase64}.${ciphertextBase64}`,
  };
}

export async function decryptPayloadAesGcm<T>(
  combinedToken: string,
  secretKeyMaterial: string
): Promise<T | null> {
  try {
    const parts = combinedToken.split('.');
    if (parts.length !== 3 || parts[0] !== 'AES256GCM') {
      return null;
    }
    const ivBuffer = base64ToBuffer(parts[1]);
    const cipherBuffer = base64ToBuffer(parts[2]);
    const key = await deriveAesGcmKey(secretKeyMaterial, 'devana-salt-v1');
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
      key,
      cipherBuffer
    );
    const jsonStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

export async function computeSha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function readFileMagicHex(file: File): Promise<string> {
  const slice = file.slice(0, 8);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) {
    return '00000000';
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('')
    .padEnd(8, '0');
}
