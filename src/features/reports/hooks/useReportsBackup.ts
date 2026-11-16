import { useEffect, useState } from 'react';
import { ApiClientError } from '../../../lib';
import type {
  ActiveUserProfileData,
  AppBid,
  AppProject,
  AppReview,
  AppWorklog,
} from '../../../types/domain';
import { computeSha256Hex, encryptPayloadAesGcm } from '../../../utils/securityCrypto';
import { shareReportByEmailApi, syncEncryptedBackupApi } from '../api/reportsApi';
import type { EncryptedBackupRecord } from '../types';

export function useReportsBackup({
  projects,
  bidsByProject,
  worklogsByProject,
  reviewsByProject,
  allWorklogs,
  selectedProject,
  currentUser,
  userEmail,
  metricsSummary,
  backupPassphrase,
  requireVerifiedAuth,
  onFeedback,
}: {
  projects: AppProject[];
  bidsByProject: Record<string, AppBid[]>;
  worklogsByProject: Record<string, AppWorklog[]>;
  reviewsByProject: Record<string, AppReview[]>;
  allWorklogs: AppWorklog[];
  selectedProject: AppProject | null;
  currentUser: ActiveUserProfileData | null;
  userEmail: string | null;
  metricsSummary: {
    totalEscrowBrl: number;
    totalHours: number;
    totalCommits: number;
    averageRating: number;
  };
  backupPassphrase: string;
  requireVerifiedAuth: () => boolean;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}) {
  const [shareEmailInput, setShareEmailInput] = useState<string>('');
  const [shareStatusMsg, setShareStatusMsg] = useState<string | null>(null);
  const [reportChecksum, setReportChecksum] = useState<string>('calculando...');
  const [lastEncryptedBackup, setLastEncryptedBackup] =
    useState<EncryptedBackupRecord | null>(null);

  useEffect(() => {
    if (!userEmail) {
      setShareEmailInput('');
      return;
    }
    setShareEmailInput((prev) => prev || userEmail);
  }, [userEmail]);

  useEffect(() => {
    const payload = JSON.stringify({
      projectCount: projects.length,
      worklogCount: Object.values(worklogsByProject).flat().length,
    });
    computeSha256Hex(payload).then(setReportChecksum);
  }, [projects, worklogsByProject]);

  const handleShareReportByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireVerifiedAuth()) return;
    setShareStatusMsg('Validando schema Zod e token Firebase...');
    try {
      const data = await shareReportByEmailApi({
        recipientEmail: shareEmailInput.trim(),
        projectTitle: selectedProject?.title || 'Portfólio Geral Devana',
        totalHours: metricsSummary.totalHours,
        totalCommits: metricsSummary.totalCommits,
        escrowTotalBrl: metricsSummary.totalEscrowBrl,
        checksumSha256: reportChecksum.padEnd(64, '0').slice(0, 64),
      });
      setShareStatusMsg(
        `Relatório enviado para ${data.recipientEmail} (Protocolo: ${data.dispatchId} · SHA-256 verificado).`
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setShareStatusMsg(`Erro: ${err.message} ${err.nextStep || ''}`);
      } else {
        setShareStatusMsg('Falha ao conectar ao endpoint de envio de relatórios.');
      }
    }
  };

  const handleEncryptedCloudBackup = async () => {
    if (!requireVerifiedAuth() || !currentUser) return;
    if (backupPassphrase.trim().length < 8) {
      onFeedback({
        type: 'error',
        text: 'Defina uma chave secreta de criptografia com pelo menos 8 caracteres.',
      });
      return;
    }

    const snapshotPayload = {
      exportedAtIso: new Date().toISOString(),
      ownerUid: currentUser.uid,
      projects,
      bidsByProject,
      worklogsByProject,
      reviewsByProject,
    };

    const encrypted = await encryptPayloadAesGcm(snapshotPayload, backupPassphrase);
    const backupId = `bkp_${Date.now()}`;
    const recordCount =
      projects.length + Object.values(bidsByProject).flat().length + allWorklogs.length;

    const blob = new Blob([encrypted.combinedToken], {
      type: 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backupId}.devana.enc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    try {
      const data = await syncEncryptedBackupApi({
        backupId,
        ownerUid: currentUser.uid,
        algorithm: 'AES-256-GCM',
        ivBase64: encrypted.ivBase64,
        ciphertextBase64: encrypted.ciphertextBase64,
        recordCount,
      });
      setLastEncryptedBackup({
        backupId,
        combinedToken: encrypted.combinedToken,
        storedAtIso: data.storedAtIso || new Date().toISOString(),
        recordCount,
        integrityHmac: data.integrityHmac,
      });
      onFeedback({
        type: 'success',
        text: `Backup criptografado AES-256-GCM (${recordCount} registros) salvo no servidor e baixado (.devana.enc).`,
      });
    } catch (err) {
      setLastEncryptedBackup({
        backupId,
        combinedToken: encrypted.combinedToken,
        storedAtIso: new Date().toISOString(),
        recordCount,
      });
      if (err instanceof ApiClientError) {
        onFeedback({ type: 'error', text: err.message });
      }
    }
  };

  return {
    shareEmailInput,
    setShareEmailInput,
    shareStatusMsg,
    reportChecksum,
    lastEncryptedBackup,
    handleShareReportByEmail,
    handleEncryptedCloudBackup,
  };
}
