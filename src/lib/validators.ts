import { VALIDATION_CONSTANTS } from '../firebase';
import { MAX_PROJECT_BUDGET_BRL, MIN_PROJECT_BUDGET_BRL } from './constants';

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function isSafeProjectId(id: string): boolean {
  return (
    Boolean(id) &&
    id.length <= VALIDATION_CONSTANTS.ID_MAX_LENGTH &&
    VALIDATION_CONSTANTS.ID_PATTERN.test(id)
  );
}

export function validateProjectInput(input: {
  title: string;
  description: string;
  budget: number | string;
  deadlineDays: number | string;
  repoUrl: string;
}): ValidationResult<{
  title: string;
  description: string;
  budget: number;
  deadlineDays: number;
  repoUrl: string;
}> {
  const title = input.title.trim();
  const description = input.description.trim();
  const budget = Number(input.budget);
  const deadlineDays = Number(input.deadlineDays);
  const repoUrl = input.repoUrl.trim().slice(0, 300);

  if (
    title.length < VALIDATION_CONSTANTS.PROJECT_TITLE_MIN ||
    title.length > VALIDATION_CONSTANTS.PROJECT_TITLE_MAX
  ) {
    return {
      ok: false,
      error: 'O título do projeto deve ter entre 5 e 140 caracteres.',
    };
  }

  if (
    description.length < VALIDATION_CONSTANTS.PROJECT_DESC_MIN ||
    description.length > VALIDATION_CONSTANTS.PROJECT_DESC_MAX
  ) {
    return {
      ok: false,
      error: 'A especificação técnica deve ter entre 10 e 3000 caracteres.',
    };
  }

  if (
    Number.isNaN(budget) ||
    budget < MIN_PROJECT_BUDGET_BRL ||
    budget > MAX_PROJECT_BUDGET_BRL
  ) {
    return {
      ok: false,
      error: 'Informe um orçamento válido entre R$ 50 e R$ 10.000.000.',
    };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      budget,
      deadlineDays: Math.min(
        Math.max(1, Number.isNaN(deadlineDays) ? 14 : deadlineDays),
        365
      ),
      repoUrl,
    },
  };
}

export function validateBidInput(input: {
  amount: number | string;
  deliveryDays: number | string;
  pitch: string;
}): ValidationResult<{
  amount: number;
  deliveryDays: number;
  pitch: string;
}> {
  const pitch = input.pitch.trim();
  const amount = Number(input.amount);
  const deliveryDays = Number(input.deliveryDays);

  if (
    pitch.length < VALIDATION_CONSTANTS.BID_PITCH_MIN ||
    pitch.length > VALIDATION_CONSTANTS.BID_PITCH_MAX
  ) {
    return {
      ok: false,
      error: 'A proposta técnica deve conter entre 10 e 1500 caracteres.',
    };
  }

  if (
    Number.isNaN(amount) ||
    amount < MIN_PROJECT_BUDGET_BRL ||
    amount > MAX_PROJECT_BUDGET_BRL
  ) {
    return {
      ok: false,
      error: 'Informe um valor de proposta válido a partir de R$ 50.',
    };
  }

  return {
    ok: true,
    data: {
      amount,
      deliveryDays: Math.min(
        Math.max(1, Number.isNaN(deliveryDays) ? 7 : deliveryDays),
        365
      ),
      pitch,
    },
  };
}

export function validateWorklogInput(input: {
  hours: number | string;
  commitHash: string;
  branchName: string;
  commitMessage: string;
}): ValidationResult<{
  hours: number;
  commitHash: string;
  branchName: string;
  commitMessage: string;
}> {
  const hours = Number(input.hours);
  const commitHash = input.commitHash.trim();
  const branchName = input.branchName.trim().slice(0, 100) || 'main';
  const commitMessage =
    input.commitMessage.trim().slice(0, 500) || 'Entrega incremental de código';

  if (
    !VALIDATION_CONSTANTS.COMMIT_HASH_PATTERN.test(commitHash) ||
    commitHash.length < VALIDATION_CONSTANTS.COMMIT_HASH_MIN
  ) {
    return {
      ok: false,
      error:
        'O hash do commit Git deve conter entre 7 e 40 caracteres hexadecimais (ex: a4f82c19).',
    };
  }

  if (Number.isNaN(hours) || hours <= 0 || hours > 24) {
    return {
      ok: false,
      error: 'Registre entre 0.1 e 24 horas por sessão.',
    };
  }

  return {
    ok: true,
    data: {
      hours,
      commitHash: commitHash.slice(0, VALIDATION_CONSTANTS.COMMIT_HASH_MAX),
      branchName,
      commitMessage,
    },
  };
}

export function validateReviewInput(input: {
  comment: string;
}): ValidationResult<{ comment: string }> {
  const comment = input.comment.trim();
  if (
    comment.length < VALIDATION_CONSTANTS.REVIEW_COMMENT_MIN ||
    comment.length > VALIDATION_CONSTANTS.REVIEW_COMMENT_MAX
  ) {
    return {
      ok: false,
      error: 'Escreva uma avaliação entre 5 e 1000 caracteres.',
    };
  }
  return { ok: true, data: { comment } };
}
