import { timingSafeEqual } from "node:crypto";

const LOCATION_SECRET_ENV_KEYS = ["LOCATION_SECRET", "LOCATION_UPDATE_SECRET"];

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

export const getLocationSecrets = (env = process.env) =>
  LOCATION_SECRET_ENV_KEYS.map((key) => normalizeSecret(env[key])).filter(
    Boolean
  );

export const hasLocationSecret = (env = process.env) =>
  getLocationSecrets(env).length > 0;

export const isLocationAuthorized = (
  authorization?: string,
  env = process.env
) => {
  const normalizedAuthorization = normalizeSecret(authorization);
  if (!normalizedAuthorization) return false;

  const authBuffer = Buffer.from(normalizedAuthorization);
  return getLocationSecrets(env).some((secret) => {
    const secretBuffer = Buffer.from(secret);

    if (authBuffer.length !== secretBuffer.length) return false;
    return timingSafeEqual(authBuffer, secretBuffer);
  });
};
