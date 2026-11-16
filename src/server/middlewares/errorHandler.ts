import type { NextFunction, Request, Response } from 'express';
import { AppError, buildErrorBody } from '../errors.ts';
import { logger } from '../logger.ts';

export function apiNotFoundHandler(_req: Request, res: Response) {
  return res.status(404).json(
    buildErrorBody({
      code: 'NOT_FOUND',
      message: 'Endpoint de API não encontrado.',
      nextStep: 'Verifique o caminho e o método HTTP da requisição.',
    })
  );
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) {
    return;
  }

  const reqWithId = req as Request & { id?: string | number };

  if (err instanceof AppError) {
    return res.status(err.status).json(
      buildErrorBody({
        code: err.code,
        message: err.message,
        nextStep: err.nextStep,
        details: err.details,
      })
    );
  }

  const syntaxErr = err as { type?: string; status?: number; message?: string };
  if (syntaxErr?.type === 'entity.parse.failed') {
    return res.status(400).json(
      buildErrorBody({
        code: 'INVALID_JSON',
        message: 'Corpo da requisição JSON malformado.',
        nextStep: 'Verifique a sintaxe JSON enviada no payload.',
      })
    );
  }

  if (syntaxErr?.type === 'entity.too.large') {
    return res.status(413).json(
      buildErrorBody({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload excede o tamanho máximo permitido (250 KB).',
        nextStep: 'Reduza o tamanho dos dados enviados.',
      })
    );
  }

  logger.error(
    {
      requestId: reqWithId.id,
      method: req.method,
      path: req.path,
      errorName: err instanceof Error ? err.name : 'UnknownError',
      errorMessage: err instanceof Error ? err.message : String(err),
    },
    'Unhandled server error'
  );

  return res.status(500).json(
    buildErrorBody({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno ao processar a requisição.',
      nextStep: 'Tente novamente em instantes.',
    })
  );
}
