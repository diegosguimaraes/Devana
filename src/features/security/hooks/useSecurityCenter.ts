import { useEffect, useState } from 'react';
import { ApiClientError } from '../../../lib';
import type { ActiveUserProfileData } from '../../../types/domain';
import {
  decryptPayloadAesGcm,
  encryptPayloadAesGcm,
  readFileMagicHex,
} from '../../../utils/securityCrypto';
import {
  fetchUserWebhooksApi,
  registerWebhookApi,
  savePrivatePiiSettings,
  verifyUploadMagicBytesApi,
} from '../api/securityApi';
import type { UploadCheckResult, WebhookItem, WebhookProvider } from '../types';

export function useSecurityCenter({
  authReady,
  isAuthenticated,
  isEmailVerified,
  userEmail,
  currentUser,
  backupPassphrase,
  pushPrefs,
  requireVerifiedAuth,
  onFeedback,
}: {
  authReady: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  userEmail: string | null;
  currentUser: ActiveUserProfileData | null;
  backupPassphrase: string;
  pushPrefs: {
    pushEnabled: boolean;
    notifyOnBid: boolean;
    notifyOnMessage: boolean;
    notifyOnEscrow: boolean;
  };
  requireVerifiedAuth: () => boolean;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [piiEmail, setPiiEmail] = useState<string>('');
  const [piiDocument, setPiiDocument] = useState<string>('');
  const [piiPhone, setPiiPhone] = useState<string>('');
  const [encryptedPiiPreview, setEncryptedPiiPreview] = useState<string>('');
  const [decryptedPiiPreview, setDecryptedPiiPreview] = useState<string | null>(null);
  const [uploadCheckResult, setUploadCheckResult] = useState<UploadCheckResult | null>(
    null
  );
  const [webhookProvider, setWebhookProvider] = useState<WebhookProvider>('github');
  const [webhookTarget, setWebhookTarget] = useState<string>('');
  const [webhooksList, setWebhooksList] = useState<WebhookItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setWebhooksList([]);
      setPiiEmail('');
      return;
    }
    if (userEmail) {
      setPiiEmail((prev) => prev || userEmail);
    }
  }, [isAuthenticated, userEmail]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !isEmailVerified) {
      setWebhooksList([]);
      return;
    }

    let cancelled = false;
    fetchUserWebhooksApi()
      .then((webhooks) => {
        if (!cancelled) {
          setWebhooksList(webhooks);
        }
      })
      .catch(() => {
        // Ignore transient network errors
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthenticated, isEmailVerified]);

  useEffect(() => {
    encryptPayloadAesGcm(
      { email: piiEmail, taxDocument: piiDocument, phone: piiPhone },
      backupPassphrase
    ).then((res) => {
      setEncryptedPiiPreview(res.combinedToken);
    });
  }, [piiEmail, piiDocument, piiPhone, backupPassphrase]);

  const handleSaveIsolatedPii = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireVerifiedAuth() || !currentUser) return;
    if (backupPassphrase.trim().length < 8) {
      onFeedback({
        type: 'error',
        text: 'Informe uma chave de criptografia (mín. 8 caracteres) em Relatórios ou abaixo para cifrar o PII.',
      });
      return;
    }

    const encrypted = await encryptPayloadAesGcm(
      { email: piiEmail, taxDocument: piiDocument, phone: piiPhone },
      backupPassphrase
    );
    setEncryptedPiiPreview(encrypted.combinedToken);

    await savePrivatePiiSettings(currentUser.uid, {
      encryptedPiiPayload: encrypted.combinedToken,
      pushNotificationsEnabled: pushPrefs.pushEnabled,
      notifyOnBid: pushPrefs.notifyOnBid,
      notifyOnMessage: pushPrefs.notifyOnMessage,
      notifyOnEscrow: pushPrefs.notifyOnEscrow,
    });

    const decrypted = await decryptPayloadAesGcm<{
      email: string;
      taxDocument: string;
      phone: string;
    }>(encrypted.combinedToken, backupPassphrase);
    setDecryptedPiiPreview(
      decrypted
        ? `Decriptado em memória: ${decrypted.email} · Doc: ${decrypted.taxDocument} · Tel: ${decrypted.phone}`
        : null
    );
    onFeedback({
      type: 'success',
      text: 'Dados sensíveis (PII) criptografados com AES-256-GCM e isolados na subcoleção privada.',
    });
  };

  const handleFileUploadVerification = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!requireVerifiedAuth()) return;

    const magicHex = await readFileMagicHex(file);
    const declaredMimeType = (file.type || 'application/pdf') as
      'application/pdf' | 'image/png' | 'image/jpeg' | 'text/csv';

    try {
      const data = await verifyUploadMagicBytesApi({
        originalName: file.name.slice(0, 120),
        declaredMimeType: [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'text/csv',
        ].includes(declaredMimeType)
          ? declaredMimeType
          : 'application/pdf',
        sizeBytes: file.size,
        magicHexPrefix: magicHex,
      });
      setUploadCheckResult({
        ok: true,
        message: `Arquivo autêntico validado! Renomeado com segurança para: ${data.safeStorageName}`,
        detail: `Magic Hex: ${magicHex} · Isolado em: ${data.storageZone}`,
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setUploadCheckResult({
          ok: false,
          message: err.message || 'Upload bloqueado pelas diretrizes de segurança.',
          detail: `Magic Hex detectado: ${magicHex} · ${err.nextStep || ''}`,
        });
      } else {
        setUploadCheckResult({
          ok: false,
          message: 'Falha ao validar assinatura binária no servidor.',
        });
      }
    }
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireVerifiedAuth()) return;
    try {
      const webhook = await registerWebhookApi({
        provider: webhookProvider,
        repositoryOrChannel: webhookTarget.trim(),
        events: ['push', 'pull_request', 'milestone_released'],
      });
      if (webhook) {
        setWebhooksList((prev) => [webhook, ...prev]);
        setWebhookTarget('');
        onFeedback({
          type: 'success',
          text: `Integração ${webhook.provider.toUpperCase()} conectada para ${webhook.repositoryOrChannel}.`,
        });
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Erro de comunicação ao salvar integração.';
      onFeedback({ type: 'error', text: message });
    }
  };

  return {
    piiEmail,
    setPiiEmail,
    piiDocument,
    setPiiDocument,
    piiPhone,
    setPiiPhone,
    encryptedPiiPreview,
    decryptedPiiPreview,
    uploadCheckResult,
    webhookProvider,
    setWebhookProvider,
    webhookTarget,
    setWebhookTarget,
    webhooksList,
    handleSaveIsolatedPii,
    handleFileUploadVerification,
    handleAddWebhook,
  };
}
