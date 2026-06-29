import type { BrexListResponse, BrexTransaction } from "./types";

const BREX_API_BASE = "https://platform.brexapis.com";
const MAX_RETRIES = 3;

function getBrexToken(): string {
  const token = process.env.BREX_API_TOKEN?.trim();
  if (!token) throw new Error("Missing BREX_API_TOKEN environment variable");
  return token;
}

async function fetchWithRetry(
  url: string,
  token: string,
  attempt = 0,
): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 429 && attempt < MAX_RETRIES) {
    const wait = Math.pow(2, attempt) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return fetchWithRetry(url, token, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brex API ${res.status}: ${body}`);
  }

  return res;
}

export async function fetchTransactions(
  postedAtStart: string,
): Promise<BrexTransaction[]> {
  const token = getBrexToken();
  const all: BrexTransaction[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({
      limit: "100",
      posted_at_start: postedAtStart,
    });
    if (cursor) params.set("cursor", cursor);

    const url = `${BREX_API_BASE}/v2/transactions/card/primary?${params}`;
    const res = await fetchWithRetry(url, token);
    const data: BrexListResponse = await res.json();

    all.push(...data.items);
    cursor = data.next_cursor;
  } while (cursor);

  return all;
}
