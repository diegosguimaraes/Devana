import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';

describe('Devana Express API Routes (Supertest)', () => {
  const app = createApp();

  it('GET /api/health returns operational service metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('GET /api/security/posture exposes zero-commission and security posture flags', async () => {
    const res = await request(app).get('/api/security/posture');
    expect(res.status).toBe(200);
    expect(res.body.commissionRatePercent).toBe(0);
    expect(res.body.helmetCspActive).toBe(true);
    expect(res.body.corsWhitelistActive).toBe(true);
    expect(res.body.escrowLedgerAppendOnly).toBe(true);
  });

  it('GET /api/github/commits rejects malformed repository slugs with VALIDATION_ERROR', async () => {
    const res = await request(app).get('/api/github/commits?repo=invalid-slug');
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    expect(res.body.error?.nextStep).toBeTruthy();
  });

  it('GET /api/non-existent returns standardized 404 NOT_FOUND payload', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.error?.code).toBe('NOT_FOUND');
  });

  it('protects /api/reports/share-email and /api/escrow/ledger without Firebase Bearer token', async () => {
    const shareRes = await request(app)
      .post('/api/reports/share-email')
      .send({
        recipientEmail: 'auditoria@devana.dev',
        projectTitle: 'API PIX',
        totalHours: 10,
        totalCommits: 4,
        escrowTotalBrl: 4500,
        checksumSha256: 'a'.repeat(64),
      });
    expect(shareRes.status).toBe(401);
    expect(shareRes.body.error?.code).toBe('AUTH_REQUIRED');

    const ledgerRes = await request(app).post('/api/escrow/ledger').send({
      projectId: 'proj_1',
      projectOwnerId: 'owner_1',
      freelancerId: 'dev_1',
      state: 'in_escrow',
      amount: 1000,
    });
    expect(ledgerRes.status).toBe(401);
    expect(ledgerRes.body.error?.code).toBe('AUTH_REQUIRED');
  });
});
