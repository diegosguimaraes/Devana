import crypto from 'node:crypto';
import { AppError } from '../errors.ts';
import {
  type EscrowLedgerState,
  type StoredEscrowLedgerEntry,
  vaultRepository,
} from '../repositories/vaultRepository.ts';

export interface AppendEscrowLedgerInput {
  projectId: string;
  projectOwnerId: string;
  freelancerId: string;
  actorUid: string;
  state: EscrowLedgerState;
  amount: number;
  idempotencyKey: string;
}

const VALID_ESCROW_TRANSITIONS: Record<EscrowLedgerState, readonly EscrowLedgerState[]> =
  {
    pending: ['in_escrow', 'refunded'],
    in_escrow: ['released', 'refunded'],
    released: [],
    refunded: [],
  };

function computeIntegrityHash(payload: {
  previousHash: string;
  projectId: string;
  projectOwnerId: string;
  freelancerId: string;
  actorUid: string;
  state: EscrowLedgerState;
  amount: number;
  idempotencyKey: string;
  createdAtIso: string;
}): string {
  const hmacKey = vaultRepository.getBackupHmacKey();
  return crypto
    .createHmac('sha256', hmacKey)
    .update(
      JSON.stringify({
        previousHash: payload.previousHash,
        projectId: payload.projectId,
        projectOwnerId: payload.projectOwnerId,
        freelancerId: payload.freelancerId,
        actorUid: payload.actorUid,
        state: payload.state,
        amount: payload.amount,
        commissionAmount: 0,
        idempotencyKey: payload.idempotencyKey,
        createdAtIso: payload.createdAtIso,
      })
    )
    .digest('hex');
}

export function appendEscrowLedgerAuditEntry(input: AppendEscrowLedgerInput): {
  idempotentReplay: boolean;
  entry: StoredEscrowLedgerEntry;
} {
  if (input.actorUid !== input.projectOwnerId) {
    throw new AppError({
      status: 403,
      code: 'ESCROW_FORBIDDEN',
      message:
        'Apenas o proprietário do projeto pode registrar movimentações de custódia.',
      nextStep: 'Confirme que você está autenticado com a conta contratante do projeto.',
    });
  }

  const existingByKey = vaultRepository.findEscrowLedgerByIdempotencyKey(
    input.projectId,
    input.idempotencyKey
  );

  if (existingByKey) {
    if (
      existingByKey.state !== input.state ||
      existingByKey.amount !== input.amount ||
      existingByKey.freelancerId !== input.freelancerId
    ) {
      throw new AppError({
        status: 409,
        code: 'IDEMPOTENCY_CONFLICT',
        message:
          'Chave de idempotência já utilizada para uma movimentação de custódia com parâmetros diferentes.',
        nextStep: 'Gere uma nova chave de idempotência para esta operação.',
      });
    }
    return {
      idempotentReplay: true,
      entry: existingByKey,
    };
  }

  const history = vaultRepository.listEscrowLedgerByProject(input.projectId);
  const latest = history[history.length - 1];

  if (latest) {
    const allowedNext = VALID_ESCROW_TRANSITIONS[latest.state];
    if (!allowedNext.includes(input.state)) {
      throw new AppError({
        status: 409,
        code: 'INVALID_ESCROW_TRANSITION',
        message: `Transição de custódia inválida: ${latest.state} → ${input.state}.`,
        nextStep:
          'Consulte o histórico de custódia do projeto para verificar o estado atual.',
      });
    }
  } else if (input.state !== 'pending' && input.state !== 'in_escrow') {
    throw new AppError({
      status: 409,
      code: 'INVALID_INITIAL_ESCROW_STATE',
      message: `O primeiro registro de custódia deve iniciar em pending ou in_escrow (recebido: ${input.state}).`,
      nextStep: 'Registre a ativação da garantia antes da liberação ou reembolso.',
    });
  }

  const previousHash = latest?.integrityHash || 'GENESIS_DEVANA_ESCROW_0';
  const createdAtIso = new Date().toISOString();
  const integrityHash = computeIntegrityHash({
    previousHash,
    projectId: input.projectId,
    projectOwnerId: input.projectOwnerId,
    freelancerId: input.freelancerId,
    actorUid: input.actorUid,
    state: input.state,
    amount: input.amount,
    idempotencyKey: input.idempotencyKey,
    createdAtIso,
  });

  const entry: StoredEscrowLedgerEntry = {
    entryId: `esc_${crypto.randomUUID().slice(0, 12)}`,
    projectId: input.projectId,
    projectOwnerId: input.projectOwnerId,
    freelancerId: input.freelancerId,
    actorUid: input.actorUid,
    state: input.state,
    amount: input.amount,
    commissionAmount: 0,
    idempotencyKey: input.idempotencyKey,
    previousHash,
    integrityHash,
    createdAtIso,
  };

  vaultRepository.appendEscrowLedgerEntry(input.projectId, entry);

  return {
    idempotentReplay: false,
    entry,
  };
}

export function listEscrowLedgerForParticipant(
  projectId: string,
  requesterUid: string
): StoredEscrowLedgerEntry[] {
  const entries = vaultRepository.listEscrowLedgerByProject(projectId);
  return entries.filter(
    (e) =>
      e.projectOwnerId === requesterUid ||
      e.freelancerId === requesterUid ||
      e.actorUid === requesterUid
  );
}
