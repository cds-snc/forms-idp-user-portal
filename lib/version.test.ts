import { afterAll, describe, expect, it, vi } from "vitest";

const { originalGitSha } = vi.hoisted(() => {
  const originalGitSha = process.env.GIT_SHA;
  process.env.GIT_SHA = "abcdef1234567890";

  return { originalGitSha };
});

import { getShortVersion, VERSION } from "./version";

afterAll(() => {
  if (originalGitSha === undefined) {
    delete process.env.GIT_SHA;
  } else {
    process.env.GIT_SHA = originalGitSha;
  }
});

describe("getVersion", () => {
  it("captures GIT_SHA once at module load", () => {
    process.env.GIT_SHA = "1234567890abcdef";

    expect(VERSION).toBe("abcdef1234567890");
  });
});

describe("getShortVersion", () => {
  it("shortens SHA-like versions to 7 characters", () => {
    expect(getShortVersion("abcdef1234567890")).toBe("abcdef1");
  });

  it("keeps non-SHA versions unchanged", () => {
    expect(getShortVersion("2026-04-13T12:34:56.000Z")).toBe("2026-04-13T12:34:56.000Z");
    expect(getShortVersion("release-2026-04-13")).toBe("release-2026-04-13");
  });
});
