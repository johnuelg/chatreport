const MIN_PASSWORD_LENGTH = 8;

export interface LeakedPasswordCheckResult {
  isLeaked: boolean;
  leakCount: number;
  error: string | null;
}

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
  const normalized = password.trim();

  if (normalized.length < MIN_PASSWORD_LENGTH) {
    return {
      isLeaked: false,
      leakCount: 0,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  try {
    const hash = await sha1Hex(normalized);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
      headers: {
        "Add-Padding": "true",
      },
    });

    if (!response.ok) {
      return {
        isLeaked: false,
        leakCount: 0,
        error: "Leaked password check is temporarily unavailable. Please try again.",
      };
    }

    const lines = (await response.text()).split("\n");
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
      error: "Leaked password check failed. Please retry.",
    };
  }
};