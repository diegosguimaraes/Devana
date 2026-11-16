import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors.ts';

export interface ValidationSchemas<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body?: ZodType<TBody>;
  query?: ZodType<TQuery>;
  params?: ZodType<TParams>;
  message?: string;
  nextStep?: string;
}

export interface ValidatedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> extends Request {
  validated?: {
    body: TBody;
    query: TQuery;
    params: TParams;
  };
}

export function validate<TBody = unknown, TQuery = unknown, TParams = unknown>(
  schemas: ValidationSchemas<TBody, TQuery, TParams>
) {
  return (
    req: ValidatedRequest<TBody, TQuery, TParams>,
    _res: Response,
    next: NextFunction
  ) => {
    const details: Array<{ target: string; path: string; message: string }> = [];

    let parsedBody = req.body as TBody;
    let parsedQuery = req.query as unknown as TQuery;
    let parsedParams = req.params as unknown as TParams;

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            target: 'params',
            path: issue.path.join('.') || 'params',
            message: issue.message,
          });
        }
      } else {
        parsedParams = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            target: 'query',
            path: issue.path.join('.') || 'query',
            message: issue.message,
          });
        }
      } else {
        parsedQuery = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            target: 'body',
            path: issue.path.join('.') || 'body',
            message: issue.message,
          });
        }
      } else {
        parsedBody = result.data;
      }
    }

    if (details.length > 0) {
      return next(
        new AppError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: schemas.message || 'Dados de entrada inválidos ou não permitidos.',
          nextStep:
            schemas.nextStep || 'Revise os parâmetros informados e tente novamente.',
          details,
        })
      );
    }

    req.validated = {
      body: parsedBody,
      query: parsedQuery,
      params: parsedParams,
    };

    return next();
  };
}
