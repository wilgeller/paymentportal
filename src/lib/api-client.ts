export interface ApiErrorPayload {
  error?: {
    type?: string;
    message?: string;
    scope?: string;
    invalidKey?: boolean;
  };
}

export class ClientApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.error?.message ?? `Request failed (${status})`);
    this.name = "ClientApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as T & ApiErrorPayload;

  if (!response.ok) {
    throw new ClientApiError(response.status, payload as ApiErrorPayload);
  }

  return payload;
}
