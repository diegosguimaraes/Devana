export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    nextStep?: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly nextStep?: string;
  public readonly details?: unknown;

  constructor(options: {
    status: number;
    code: string;
    message: string;
    nextStep?: string;
    details?: unknown;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.status = options.status;
    this.code = options.code;
    this.nextStep = options.nextStep;
    this.details = options.details;
  }
}

export function buildErrorBody(options: {
  code: string;
  message: string;
  nextStep?: string;
  details?: unknown;
}): ErrorResponseBody {
  const payload: ErrorResponseBody['error'] = {
    code: options.code,
    message: options.message,
  };
  if (options.nextStep) payload.nextStep = options.nextStep;
  if (options.details !== undefined) payload.details = options.details;
  return { error: payload };
}
