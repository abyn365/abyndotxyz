/**
 * Secure secrets manager utilizing environment variables (process.env) for production
 * with a transparent fallback to Bun's native OS keychain integration for local dev.
 */

export async function getSecret(
  key: string,
  service = "abyndotxyz"
): Promise<string | null> {
  // 1. In production, prioritize environment variables to eliminate keychain overhead
  const envVal = process.env[key];
  if (envVal) {
    return envVal;
  }

  // 2. Fall back to the OS keychain for local development tools (Windows / macOS)
  try {
    if (typeof Bun !== "undefined" && Bun.secrets) {
      // Using Bun's positional string API syntax: (service, name)
      const val = await Bun.secrets.get(service, key);
      if (val) {
        return val;
      }
    }
  } catch (e: any) {
    // Quietly catch headless environment platform errors
  }

  return null;
}

export async function setSecret(
  key: string,
  value: string,
  service = "abyndotxyz"
): Promise<boolean> {
  // Skip keychain writes entirely in production/headless environments
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    if (typeof Bun !== "undefined" && Bun.secrets) {
      // Using Bun's positional string API syntax: (service, name, value)
      await Bun.secrets.set(service, key, value);
      return true;
    }
  } catch (e) {
    // Quietly catch platform errors
  }
  return false;
}
