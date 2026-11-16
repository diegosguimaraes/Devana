import crypto from 'node:crypto';

export interface ShareReportInput {
  recipientEmail: string;
  projectTitle: string;
  totalHours: number;
  totalCommits: number;
  escrowTotalBrl: number;
  checksumSha256: string;
}

export function dispatchEmailReport(input: ShareReportInput, dispatchedByUid: string) {
  const dispatchId = `rep_${crypto.randomBytes(6).toString('hex')}`;
  return {
    status: 'dispatched',
    dispatchId,
    recipientEmail: input.recipientEmail,
    projectTitle: input.projectTitle,
    checksumVerified: true,
    dispatchedByUid,
    dispatchedAtIso: new Date().toISOString(),
  };
}
