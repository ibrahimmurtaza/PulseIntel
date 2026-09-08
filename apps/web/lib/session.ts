import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "pulseintel_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "pulseintel-dev-session-secret";

export type Session = {
  userId: string;
  email: string;
  name: string;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string): Buffer {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest();
}

export function createSessionValue(session: Session): string {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = signPayload(payload).toString("base64url");

  return `${payload}.${signature}`;
}

export function readSessionValue(
  rawValue: string | undefined,
): Session | undefined {
  if (!rawValue) {
    return undefined;
  }

  const [payload, signature] = rawValue.split(".");

  if (!payload || !signature) {
    return undefined;
  }

  const expected = signPayload(payload);
  const actual = Buffer.from(signature, "base64url");

  if (expected.length !== actual.length) {
    return undefined;
  }

  if (!timingSafeEqual(expected, actual)) {
    return undefined;
  }

  try {
    return JSON.parse(fromBase64Url(payload)) as Session;
  } catch {
    return undefined;
  }
}
