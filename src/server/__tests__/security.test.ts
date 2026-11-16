import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { AppError } from '../errors.ts';
import { appendEscrowLedgerAuditEntry } from '../services/escrowService.ts';

describe('Devana Server Security Hardening & Escrow Ledger', () => {
  let server: http.Server;
  let baseUrl = '';

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('sets hardened security headers including CSP, HSTS, COOP, Permissions-Policy, and X-Request-Id', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(res.headers.get('permissions-policy')).toContain('camera=()');
    expect(res.headers.get('cross-origin-opener-policy')).toBe(
      'same-origin-allow-popups'
    );
    expect(res.headers.get('content-security-policy')).toContain("object-src 'none'");
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  it('rejects disallowed CORS origins with 403 CORS_ORIGIN_DENIED', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Origin: 'https://evil-phishing.example.com',
      },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe('CORS_ORIGIN_DENIED');
  });

  it('rejects unauthenticated access to protected escrow and security endpoints', async () => {
    const ledgerPost = await fetch(`${baseUrl}/api/escrow/ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'proj_1',
        projectOwnerId: 'owner_1',
        freelancerId: 'dev_1',
        state: 'in_escrow',
        amount: 2500,
      }),
    });
    expect(ledgerPost.status).toBe(401);

    const ledgerGet = await fetch(`${baseUrl}/api/escrow/ledger/proj_1`);
    expect(ledgerGet.status).toBe(401);

    const uploadPost = await fetch(`${baseUrl}/api/security/verify-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(uploadPost.status).toBe(401);
  });

  it('enforces append-only Escrow state transitions and idempotency guarantees', () => {
    const uniqueProj = `proj_sec_${Date.now()}`;
    const fundKey = `esc_fund_${Date.now()}`;

    // Non-owner actor MUST be denied
    expect(() =>
      appendEscrowLedgerAuditEntry({
        projectId: uniqueProj,
        projectOwnerId: 'owner_uid',
        freelancerId: 'dev_uid',
        actorUid: 'intruder_uid',
        state: 'in_escrow',
        amount: 3200,
        idempotencyKey: fundKey,
      })
    ).toThrowError(AppError);

    // Initial funding succeeds with zero platform fee
    const first = appendEscrowLedgerAuditEntry({
      projectId: uniqueProj,
      projectOwnerId: 'owner_uid',
      freelancerId: 'dev_uid',
      actorUid: 'owner_uid',
      state: 'in_escrow',
      amount: 3200,
      idempotencyKey: fundKey,
    });
    expect(first.idempotentReplay).toBe(false);
    expect(first.entry.commissionAmount).toBe(0);
    expect(first.entry.state).toBe('in_escrow');

    // Identical retry replays without duplicating ledger rows
    const replay = appendEscrowLedgerAuditEntry({
      projectId: uniqueProj,
      projectOwnerId: 'owner_uid',
      freelancerId: 'dev_uid',
      actorUid: 'owner_uid',
      state: 'in_escrow',
      amount: 3200,
      idempotencyKey: fundKey,
    });
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.entry.entryId).toBe(first.entry.entryId);

    // Reusing key with mutated amount MUST throw IDEMPOTENCY_CONFLICT
    expect(() =>
      appendEscrowLedgerAuditEntry({
        projectId: uniqueProj,
        projectOwnerId: 'owner_uid',
        freelancerId: 'dev_uid',
        actorUid: 'owner_uid',
        state: 'in_escrow',
        amount: 9999,
        idempotencyKey: fundKey,
      })
    ).toThrowError(/Chave de idempotência já utilizada/);

    // Release transition chains cryptographic hash to previous entry
    const release = appendEscrowLedgerAuditEntry({
      projectId: uniqueProj,
      projectOwnerId: 'owner_uid',
      freelancerId: 'dev_uid',
      actorUid: 'owner_uid',
      state: 'released',
      amount: 3200,
      idempotencyKey: `esc_rel_${Date.now()}`,
    });
    expect(release.entry.previousHash).toBe(first.entry.integrityHash);

    // Attempting refund after release MUST throw INVALID_ESCROW_TRANSITION
    expect(() =>
      appendEscrowLedgerAuditEntry({
        projectId: uniqueProj,
        projectOwnerId: 'owner_uid',
        freelancerId: 'dev_uid',
        actorUid: 'owner_uid',
        state: 'refunded',
        amount: 3200,
        idempotencyKey: `esc_ref_${Date.now()}`,
      })
    ).toThrowError(/Transição de custódia inválida/);
  });
});
