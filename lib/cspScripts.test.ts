/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { afterEach, describe, expect, it, vi } from "vitest";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { generateCSP } from "./cspScripts";

describe("generateCSP", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a unique nonce on each call", () => {
    const first = generateCSP();
    const second = generateCSP();

    expect(first.nonce).not.toBe(second.nonce);
  });

  it("produces a single-line normalized CSP string", () => {
    const { csp } = generateCSP();

    expect(csp).not.toMatch(/\s{2,}/);
  });

  describe("production mode (NODE_ENV !== 'development')", () => {
    it("includes nonce in script-src", () => {
      vi.stubEnv("NODE_ENV", "production");
      const { csp, nonce } = generateCSP();

      expect(csp).toContain(`'nonce-${nonce}'`);
      expect(csp).toContain("script-src");
    });

    it("includes nonce in style-src", () => {
      vi.stubEnv("NODE_ENV", "production");
      const { csp, nonce } = generateCSP();
      const styleSrcMatch = csp.match(/style-src([^;]+);/);

      expect(styleSrcMatch?.[1]).toContain(`nonce-${nonce}`);
    });

    it("does not include unsafe-inline in style-src", () => {
      vi.stubEnv("NODE_ENV", "production");
      const { csp } = generateCSP();

      expect(csp).not.toContain("'unsafe-inline'");
    });

    it("includes upgrade-insecure-requests", () => {
      vi.stubEnv("NODE_ENV", "production");
      const { csp } = generateCSP();

      expect(csp).toContain("upgrade-insecure-requests");
    });

    it("does not include unsafe-eval in script-src", () => {
      vi.stubEnv("NODE_ENV", "production");
      const { csp } = generateCSP();

      expect(csp).not.toContain("'unsafe-eval'");
    });

    it("includes wasm-unsafe-eval and strict-dynamic", () => {
      vi.stubEnv("NODE_ENV", "production");
      const { csp } = generateCSP();

      expect(csp).toContain("'wasm-unsafe-eval'");
      expect(csp).toContain("'strict-dynamic'");
    });
  });

  describe("development mode (NODE_ENV === 'development')", () => {
    it("includes nonce in script-src", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { csp, nonce } = generateCSP();

      expect(csp).toContain(`'nonce-${nonce}'`);
      expect(csp).toContain("script-src");
    });

    it("uses unsafe-inline in style-src instead of nonce", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { csp, nonce } = generateCSP();
      const styleSrcMatch = csp.match(/style-src([^;]+);/);

      expect(styleSrcMatch?.[1]).toContain("'unsafe-inline'");
      expect(styleSrcMatch?.[1]).not.toContain(`nonce-${nonce}`);
    });

    it("includes unsafe-eval in script-src for React dev tools", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { csp } = generateCSP();

      expect(csp).toContain("'unsafe-eval'");
    });

    it("does not include upgrade-insecure-requests to preserve localhost HTTP", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { csp } = generateCSP();

      expect(csp).not.toContain("upgrade-insecure-requests");
    });

    it("includes wasm-unsafe-eval and strict-dynamic", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { csp } = generateCSP();

      expect(csp).toContain("'wasm-unsafe-eval'");
      expect(csp).toContain("'strict-dynamic'");
    });
  });
});
