import { timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import type { NextApiRequest } from "next";

const LOCATION_SECRET_ENV_KEYS = ["LOCATION_SECRET", "LOCATION_UPDATE_SECRET"];
const LOCATION_SECRET_HEADER_KEYS = [
  "authorization",
  "x-location-secret",
  "x-api-key",
];
const LOCATION_SECRET_BODY_KEYS = ["secret", "locationSecret"];
const LOCATION_SECRET_QUERY_KEYS = ["secret", "locationSecret"];
type LocationSecretEnv = Record<string, string | undefined>;

const normalizeSecret = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const withoutBearer = trimmed.replace(/^Bearer\s+/i, "").trim();
  const quote = withoutBearer[0];
  if (
    (quote === '"' || quote === "'") &&
    withoutBearer.endsWith(quote) &&
    withoutBearer.length > 1
  ) {
    return withoutBearer.slice(1, -1).trim();
  }

  return withoutBearer;
};

export const getLocationSecrets = (env: LocationSecretEnv = process.env) =>
  LOCATION_SECRET_ENV_KEYS.map((key) => normalizeSecret(env[key])).filter(
    Boolean
  );

export const hasLocationSecret = (env: LocationSecretEnv = process.env) =>
  getLocationSecrets(env).length > 0;

export const getLocationAuthHeader = (headers: IncomingHttpHeaders) => {
  for (const key of LOCATION_SECRET_HEADER_KEYS) {
    const value = headers[key];
    const secret = Array.isArray(value) ? value[0] : value;
    const normalized = normalizeSecret(secret);

    if (normalized) return normalized;
  }

  return "";
};

const getRecordValue = (
  source: NextApiRequest["body"] | NextApiRequest["query"],
  keys: string[]
) => {
  if (!source || typeof source !== "object") return "";

  for (const key of keys) {
    const value = source[key];
    const secret = Array.isArray(value) ? value[0] : value;
    const normalized = normalizeSecret(
      typeof secret === "string" ? secret : undefined
    );

    if (normalized) return normalized;
  }

  return "";
};

export const getLocationAuthCandidate = (req: Pick<NextApiRequest, "headers" | "body" | "query">) =>
  getLocationAuthHeader(req.headers) ||
  getRecordValue(req.body, LOCATION_SECRET_BODY_KEYS) ||
  getRecordValue(req.query, LOCATION_SECRET_QUERY_KEYS);

const timingSafeMatches = (candidate: string, secret: string) => {
  const candidateBuffer = Buffer.from(candidate);
  const secretBuffer = Buffer.from(secret);
  const compareBuffer =
    candidateBuffer.length === secretBuffer.length
      ? candidateBuffer
      : Buffer.from(secret.replace(/./g, "x"));

  return (
    candidateBuffer.length === secretBuffer.length &&
    timingSafeEqual(compareBuffer, secretBuffer)
  );
};

export const isLocationAuthorized = (
  authorization?: string | string[],
  env: LocationSecretEnv = process.env
) => {
  const headerValue = Array.isArray(authorization)
    ? authorization[0]
    : authorization;
  const normalizedAuthorization = normalizeSecret(headerValue);
  if (!normalizedAuthorization) return false;

  return getLocationSecrets(env).some((secret) =>
    timingSafeMatches(normalizedAuthorization, secret)
  );
};

export const isLocationRequestAuthorized = (
  req: Pick<NextApiRequest, "headers" | "body" | "query">,
  env: LocationSecretEnv = process.env
) => isLocationAuthorized(getLocationAuthCandidate(req), env);

export const getLocationAuthDiagnostics = (
  req: Pick<NextApiRequest, "headers" | "body" | "query">
) => ({
  hasHeaderCredential: Boolean(getLocationAuthHeader(req.headers)),
  hasBodyCredential: Boolean(getRecordValue(req.body, LOCATION_SECRET_BODY_KEYS)),
  hasQueryCredential: Boolean(
    getRecordValue(req.query, LOCATION_SECRET_QUERY_KEYS)
  ),
});
