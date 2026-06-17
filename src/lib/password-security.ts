const MIN_PASSWORD_LENGTH = 8;
const HIBP_API_BASE = "https://api.pwnedpasswords.com/range/";
const HIBP_TIMEOUT_MS = 6000;
const HIBP_MAX_RETRIES = 2;
const MAX_RETRY_AFTER_SECONDS = 15;

export interface LeakedPasswordCheckResult {
  isLeaked: boolean;
  leakCount: number;
  error: string | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => window.clearTimeout(timeoutId) };
};

const parseRetryAfterMs = (header: string | null) => {
  if (!header) return null;

  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds, MAX_RETRY_AFTER_SECONDS) * 1000;
  }

  const dateMs = Date.parse(header);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, Math.min(dateMs - Date.now(), MAX_RETRY_AFTER_SECONDS * 1000));
  }

  return null;
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

const sha1Hex = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return toHex(hash);
};

export const checkLeakedPassword = async (password: string): Promise<LeakedPasswordCheckResult> => {
  const rawPassword = password;

  if (rawPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      isLeaked: false,
      leakCount: 0,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  try {
    const hash = await sha1Hex(rawPassword);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    let response: Response | null = null;
    for (let attempt = 0; attempt <= HIBP_MAX_RETRIES; attempt++) {
      const { signal, clear } = withTimeoutSignal(HIBP_TIMEOUT_MS);

      try {
        response = await fetch(`${HIBP_API_BASE}${prefix}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Add-Padding": "true",
          },
          signal,
        });
      } catch (error) {
        clear();
        const isAbort = error instanceof DOMException && error.name === "AbortError";

        if (attempt < HIBP_MAX_RETRIES) {
          const backoffMs = isAbort ? 500 * (attempt + 1) : 800 * (attempt + 1);
          await sleep(backoffMs);
          continue;
        }

        return {
          isLeaked: false,
          leakCount: 0,
          error: isAbort
            ? "Password safety check timed out. Please retry in a moment."
            : "Password safety check is unavailable right now. Please retry.",
        };
      }

      clear();

      if (response.status === 429 && attempt < HIBP_MAX_RETRIES) {
        const retryAfterMs = parseRetryAfterMs(response.headers.get("Retry-After"));
        await sleep(retryAfterMs ?? 800 * (attempt + 1));
        response = null;
        continue;
      }

      if (response.status >= 500 && response.status <= 599 && attempt < HIBP_MAX_RETRIES) {
        await sleep(800 * (attempt + 1));
        response = null;
        continue;
      }

      break;
    }

    if (!response || !response.ok) {
      return {
        isLeaked: false,
        leakCount: 0,
        error: response?.status === 429
          ? "Password safety check is rate-limited. Please wait a moment and try again."
          : "Password safety check is temporarily unavailable. Please try again.",
      };
    }

    const lines = (await response.text()).split(/\r?\n/);
    const match = lines.find((line) => {
      const [hashSuffix] = line.trim().split(":");
      return hashSuffix === suffix;
    });

    if (!match) {
      return {
        isLeaked: false,
        leakCount: 0,
        error: null,
      };
    }

    const [, countRaw] = match.trim().split(":");
    const leakCount = Number.parseInt(countRaw ?? "0", 10);

    return {
      isLeaked: leakCount > 0,
      leakCount,
      error: null,
    };
  } catch {
    return {
      isLeaked: false,
      leakCount: 0,
      error: "Password safety check failed. Please retry.",
    };
  }
};