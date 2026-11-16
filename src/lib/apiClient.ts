export interface ApiErrorPayload {
  code: string;
  message: string;
  status: number;
  nextStep?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly nextStep?: string;
  public readonly details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiClientError';
    this.code = payload.code;
    this.status = payload.status;
    this.nextStep = payload.nextStep;
    this.details = payload.details;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  retries?: number;
  timeoutMs?: number;
}

type TokenProvider = () => Promise<string | null>;
type RequestInterceptor = (
  url: string,
  init: RequestInit
) => Promise<RequestInit> | RequestInit;
type ErrorInterceptor = (error: ApiClientError) => void;

let tokenProvider: TokenProvider | null = null;
const requestInterceptors = new Set<RequestInterceptor>();
const errorInterceptors = new Set<ErrorInterceptor>();

export function setAuthTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

export function addRequestInterceptor(fn: RequestInterceptor): () => void {
  requestInterceptors.add(fn);
  return () => {
    requestInterceptors.delete(fn);
  };
}

export function addErrorInterceptor(fn: ErrorInterceptor): () => void {
  errorInterceptors.add(fn);
  return () => {
    errorInterceptors.delete(fn);
  };
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function parseErrorResponse(res: Response): Promise<ApiErrorPayload> {
  let raw: Record<string, unknown> | null;
  try {
    raw = (await res.json()) as Record<string, unknown>;
  } catch {
    raw = null;
  }

  // Standardized format: { error: { code, message, details?, nextStep? } }
  if (raw && typeof raw.error === 'object' && raw.error !== null) {
    const errObj = raw.error as Record<string, unknown>;
    return {
      code: String(errObj.code || `HTTP_${res.status}`),
      message: String(errObj.message || `Erro HTTP ${res.status}`),
      status: res.status,
      nextStep: errObj.nextStep ? String(errObj.nextStep) : undefined,
      details: errObj.details,
    };
  }

  // Legacy format: { error: string, nextStep?: string }
  return {
    code: String(raw?.code || `HTTP_${res.status}`),
    message: String(
      raw?.error || raw?.message || `Falha na requisição (HTTP ${res.status}).`
    ),
    status: res.status,
    nextStep: raw?.nextStep ? String(raw.nextStep) : undefined,
    details: raw?.details,
  };
}

async function request<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    body,
    auth = false,
    retries,
    timeoutMs = 12_000,
    headers: customHeaders,
    method = 'GET',
    ...rest
  } = options;

  const upperMethod = method.toUpperCase();
  const maxRetries =
    typeof retries === 'number'
      ? retries
      : upperMethod === 'GET' || upperMethod === 'HEAD'
        ? 2
        : 0;

  let attempt = 0;
  let lastError: ApiClientError | null = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = new Headers(customHeaders);
      if (body !== undefined && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (auth && tokenProvider) {
        const token = await tokenProvider();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }

      let init: RequestInit = {
        ...rest,
        method: upperMethod,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      };

      for (const interceptor of requestInterceptors) {
        init = await interceptor(url, init);
      }

      const response = await fetch(url, init);
      if (!response.ok) {
        const parsed = await parseErrorResponse(response);
        const clientErr = new ApiClientError(parsed);

        if (attempt < maxRetries && isRetryableStatus(response.status)) {
          lastError = clientErr;
          attempt += 1;
          await new Promise((r) => window.setTimeout(r, 250 * attempt));
          continue;
        }

        for (const onErr of errorInterceptors) {
          onErr(clientErr);
        }
        throw clientErr;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof ApiClientError) {
        throw err;
      }
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const networkErr = new ApiClientError({
        code: isAbort ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
        message: isAbort
          ? 'A requisição demorou mais do que o esperado. Tente novamente.'
          : 'Falha de conexão com o servidor Devana.',
        status: 0,
      });

      if (attempt < maxRetries) {
        lastError = networkErr;
        attempt += 1;
        await new Promise((r) => window.setTimeout(r, 250 * attempt));
        continue;
      }

      for (const onErr of errorInterceptors) {
        onErr(networkErr);
      }
      throw networkErr;
    } finally {
      window.clearTimeout(timer);
    }
  }

  throw (
    lastError ||
    new ApiClientError({
      code: 'UNKNOWN_ERROR',
      message: 'Erro inesperado na comunicação com a API.',
      status: 0,
    })
  );
}

export const apiClient = {
  get: <T>(url: string, options?: ApiRequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(url, { ...options, method: 'POST', body }),
  put: <T>(url: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(url, { ...options, method: 'PUT', body }),
  delete: <T>(url: string, options?: ApiRequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
