/**
 * Secure secrets manager using Bun's native OS keychain integration (Bun.secrets)
 * with a transparent fallback to environment variables (process.env).
 */

export async function getSecret(
  key: string,
  service = "abyndotxyz"
): Promise<string | null> {
  // 1. Try to read from OS keychain using Bun.secrets
  try {
    if (typeof Bun !== "undefined" && Bun.secrets) {
      const val = await Bun.secrets.get({ service, name: key } as any);
      if (val) {
        return val;
      }
    }
  } catch (e: any) {
    // Silence expected headless Linux platform errors to keep PM2 logs clean
    if (
      e?.code !== "ERR_SECRETS_PLATFORM_ERROR" &&
      !e?.message?.includes("org.freedesktop.secrets")
    ) {
      console.warn(`[Secrets] OS keychain read failed for key ${key}:`, e);
    }
  }

  // 2. Fall back to environment variables
  const envVal = process.env[key];
  if (envVal) {
    try {
      if (typeof Bun !== "undefined" && Bun.secrets) {
        await Bun.secrets.set({
          service,
          name: key,
          value: envVal,
        });
      }
    } catch (e) {
      // Quietly swallow write errors on headless environments
    }
    return envVal;
  }

  return null;
}

export async function setSecret(
  key: string,
  value: string,
  service = "abyndotxyz"
): Promise<boolean> {
  try {
    if (typeof Bun !== "undefined" && Bun.secrets) {
      await Bun.secrets.set({
        service,
        name: key,
        value,
      });
      return true;
    }
  } catch (e) {
    console.warn(`[Secrets] OS keychain set failed for key ${key}:`, e);
  }
  return false;
}
