// Retries Neon's HTTP requests through brief network failures. Dependency-free so it can be tested on its own.
//
// A request that never connected can't have reached the database, so it is always safe to repeat. A connection
// lost later (e.g. ECONNRESET) may have run the query already, so only read queries are repeated in that case:
// repeating an INSERT could save the same enquiry twice.

type FetchLike = (input: never, init?: never) => Promise<unknown>;

const NEVER_CONNECTED = new Set(["UND_ERR_CONNECT_TIMEOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ENETUNREACH", "EHOSTUNREACH"]);

function errorCode(err: unknown): string {
  const e = err as { code?: unknown; cause?: { code?: unknown } } | null;
  return String(e?.cause?.code ?? e?.code ?? "");
}

/** True only for a single SELECT; transactions and anything else count as writes. */
function isReadOnly(init: unknown): boolean {
  const body = (init as { body?: unknown } | undefined)?.body;
  if (typeof body !== "string") return false;
  try {
    const query = (JSON.parse(body) as { query?: unknown }).query;
    return typeof query === "string" && /^\s*\(?\s*select\b/i.test(query);
  } catch {
    return false;
  }
}

export function withRetry<F extends FetchLike>(fetchFn: F, { attempts = 3, baseDelayMs = 250 } = {}): F {
  const retrying = async (input: never, init?: never) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fetchFn(input, init);
      } catch (err) {
        const retryable = NEVER_CONNECTED.has(errorCode(err)) || isReadOnly(init);
        if (attempt >= attempts || !retryable) throw err;
        await new Promise((r) => setTimeout(r, baseDelayMs * 3 ** (attempt - 1)));
      }
    }
  };
  return retrying as F;
}
