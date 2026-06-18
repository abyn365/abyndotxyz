import { describe, expect, it } from "vitest";
import {
  getLocationAuthCandidate,
  getLocationAuthHeader,
  getLocationAuthDiagnostics,
  getLocationSecrets,
  hasLocationSecret,
  isLocationAuthorized,
  isLocationRequestAuthorized,
} from "../lib/locationAuth";

describe("location auth", () => {
  it("authorizes the raw LOCATION_SECRET value", () => {
    const env = { LOCATION_SECRET: "secret-value" };

    expect(isLocationAuthorized("secret-value", env)).toBe(true);
  });

  it("normalizes whitespace, quotes, and Bearer prefixes", () => {
    const env = { LOCATION_SECRET: " secret-value\n" };

    expect(isLocationAuthorized("Bearer 'secret-value' ", env)).toBe(true);
  });

  it("supports LOCATION_UPDATE_SECRET as a fallback secret name", () => {
    const env = { LOCATION_UPDATE_SECRET: "fallback-secret" };

    expect(hasLocationSecret(env)).toBe(true);
    expect(getLocationSecrets(env)).toEqual(["fallback-secret"]);
    expect(isLocationAuthorized("fallback-secret", env)).toBe(true);
  });

  it("authorizes alternate secret headers when Authorization is stripped", () => {
    const env = { LOCATION_SECRET: "secret-value" };

    expect(
      isLocationRequestAuthorized(
        { headers: { "x-location-secret": "secret-value" }, body: {}, query: {} },
        env
      )
    ).toBe(true);
    expect(
      isLocationRequestAuthorized(
        { headers: { "x-api-key": "secret-value" }, body: {}, query: {} },
        env
      )
    ).toBe(true);
  });

  it("prefers the first configured secret header", () => {
    expect(
      getLocationAuthHeader({
        authorization: "",
        "x-location-secret": "secret-value",
      })
    ).toBe("secret-value");
  });

  it("authorizes body and query credentials when headers are unavailable", () => {
    const env = { LOCATION_SECRET: "secret-value" };

    expect(
      isLocationRequestAuthorized(
        { headers: {}, body: { secret: "secret-value" }, query: {} },
        env
      )
    ).toBe(true);
    expect(
      isLocationRequestAuthorized(
        { headers: {}, body: {}, query: { locationSecret: "secret-value" } },
        env
      )
    ).toBe(true);
  });

  it("reports credential presence without exposing secret values", () => {
    const req = {
      headers: {},
      body: { secret: "secret-value" },
      query: {},
    };

    expect(getLocationAuthCandidate(req)).toBe("secret-value");
    expect(getLocationAuthDiagnostics(req)).toEqual({
      hasHeaderCredential: false,
      hasBodyCredential: true,
      hasQueryCredential: false,
    });
  });

  it("rejects missing or mismatched secrets", () => {
    expect(hasLocationSecret({})).toBe(false);
    expect(isLocationAuthorized("secret-value", {})).toBe(false);
    expect(
      isLocationAuthorized("wrong-secret", { LOCATION_SECRET: "secret-value" })
    ).toBe(false);
  });
});
