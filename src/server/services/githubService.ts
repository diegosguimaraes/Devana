import { AppError } from '../errors.ts';

export interface SanitizedGithubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export async function fetchPublicGithubCommits(
  owner: string,
  repo: string
): Promise<{ repo: string; commits: SanitizedGithubCommit[] }> {
  const safeUrl = `https://api.github.com/repos/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repo)}/commits?per_page=5`;

  let response: globalThis.Response;
  try {
    response = await fetch(safeUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Devana-Workspace-Integration',
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AppError({
      status: 502,
      code: 'GITHUB_UPSTREAM_ERROR',
      message: 'Falha de comunicação com a API do GitHub.',
      nextStep: 'Você pode registrar o hash do commit manualmente no formulário abaixo.',
    });
  }

  if (!response.ok) {
    throw new AppError({
      status: response.status,
      code: 'GITHUB_REPO_UNAVAILABLE',
      message: 'Não foi possível buscar os commits públicos deste repositório no GitHub.',
      nextStep: 'Verifique se o repositório é público e tente novamente.',
    });
  }

  const rawCommits = (await response.json()) as Array<{
    sha?: string;
    commit?: {
      message?: string;
      author?: { name?: string; date?: string };
    };
  }>;

  const commits = rawCommits.slice(0, 5).map((item) => ({
    sha: String(item.sha || '').slice(0, 7),
    message: String(item.commit?.message || 'Commit sem mensagem')
      .split('\n')[0]
      .slice(0, 140),
    author: String(item.commit?.author?.name || 'Developer').slice(0, 60),
    date: String(item.commit?.author?.date || new Date().toISOString()),
  }));

  return { repo: `${owner}/${repo}`, commits };
}
