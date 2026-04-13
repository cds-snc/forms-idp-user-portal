import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("GET /version", () => {
  const originalGitSha = process.env.GIT_SHA;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.GIT_SHA = originalGitSha;
  });

  test("returns GIT_SHA when the env var is set", async () => {
    process.env.GIT_SHA = "abc123";
    const { GET } = await import("./route");

    const response = GET();
    expect(await response.text()).toBe("abc123");
  });

  test("returns an ISO timestamp when GIT_SHA is not set", async () => {
    delete process.env.GIT_SHA;
    const { GET } = await import("./route");

    const response = GET();
    const body = await response.text();
    expect(body).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test("responds with content-type text/plain", async () => {
    process.env.GIT_SHA = "abc123";
    const { GET } = await import("./route");

    const response = GET();
    expect(response.headers.get("content-type")).toBe("text/plain");
  });
});
