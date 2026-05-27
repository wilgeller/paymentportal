import { assertWhopConfig, WhopConfigError } from "./config";
import type { ApiErrorBody } from "./types";

const WHOP_BASE = "https://api.whop.com/api/v1";
const MAX_RETRIES = 3;

export class WhopApiError extends Error {
  readonly status: number;
  readonly type: string;
  readonly scope?: string;

  constructor(
    status: number,
    message: string,
    type = "api_error",
    scope?: string,
  ) {
    super(message);
    this.name = "WhopApiError";
    this.status = status;
    this.type = type;
    this.scope = scope;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractScope(message: string): string | undefined {
  const match = message.match(/`([^`]+)`/);
  return match?.[1];
}

async function parseError(response: Response): Promise<WhopApiError> {
  let body: ApiErrorBody = {};
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    /* empty */
  }
  const message =
    body.error?.message ?? `Whop API request failed (${response.status})`;
  const type = body.error?.type ?? "api_error";
  const scope =
    response.status === 403 ? extractScope(message) : undefined;
  return new WhopApiError(response.status, message, type, scope);
}

export function buildWhopUrl(
  path: string,
  params?: Record<string, string | string[] | undefined>,
): string {
  const url = new URL(`${WHOP_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, item);
        }
      } else {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

export async function whopRequest<T>(
  path: string,
  options: {
    method?: string;
    params?: Record<string, string | string[] | undefined>;
    body?: unknown;
  } = {},
): Promise<T> {
  const { apiKey } = assertWhopConfig();
  const url = buildWhopUrl(path, options.params);
  const method = options.method ?? "GET";

  let attempt = 0;
  while (true) {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 500;
      attempt += 1;
      await sleep(delay);
      continue;
    }

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }
}

export function toApiJsonError(error: unknown) {
  if (error instanceof WhopConfigError) {
    return {
      status: 503,
      body: {
        error: {
          type: "config_missing",
          message: error.message,
          code: error.code,
        },
      },
    };
  }

  if (error instanceof WhopApiError) {
    return {
      status: error.status,
      body: {
        error: {
          type: error.type,
          message: error.message,
          scope: error.scope,
          invalidKey: error.status === 401,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        type: "internal_error",
        message:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
    },
  };
}
