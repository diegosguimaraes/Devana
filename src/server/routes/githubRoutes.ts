import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { type ValidatedRequest, validate } from '../middlewares/validate.ts';
import { fetchPublicGithubCommits } from '../services/githubService.ts';

const repoRegex = /^([a-zA-Z0-9_.-]{1,60})\/([a-zA-Z0-9_.-]{1,80})$/;

const GithubCommitsQuerySchema = z
  .object({
    repo: z
      .string()
      .trim()
      .regex(repoRegex, 'Formato de repositório inválido. Use proprietario/repositorio.'),
  })
  .strict();

type GithubQuery = z.infer<typeof GithubCommitsQuerySchema>;

export const githubRouter = Router();

githubRouter.get(
  '/commits',
  validate({
    query: GithubCommitsQuerySchema,
    message: 'Formato de repositório inválido.',
    nextStep:
      'Informe o repositório no formato proprietario/repositorio (ex: facebook/react).',
  }),
  async (
    req: ValidatedRequest<unknown, GithubQuery>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const repoParam = req.validated!.query.repo;
      const match = repoParam.match(repoRegex)!;
      const result = await fetchPublicGithubCommits(match[1], match[2]);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
);
