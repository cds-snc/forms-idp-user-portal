import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("pino", () => {
  const mockPinoInstance = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  return { default: vi.fn(() => mockPinoInstance) };
});

import pino from "pino";

import { logMessage } from "./logger";

const mockPinoInstance = pino() as unknown as {
  debug: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logMessage.debug", () => {
  it("logs a string message", () => {
    logMessage.debug("debug message");
    expect(mockPinoInstance.debug).toHaveBeenCalledWith("debug message");
  });

  it("logs a Record object", () => {
    logMessage.debug({ userId: "123", action: "login" });
    expect(mockPinoInstance.debug).toHaveBeenCalledWith({ userId: "123", action: "login" });
  });
});

describe("logMessage.info", () => {
  it("logs a string message", () => {
    logMessage.info("info message");
    expect(mockPinoInstance.info).toHaveBeenCalledWith("info message");
  });
});

describe("logMessage.warn", () => {
  it("logs a string message", () => {
    logMessage.warn("warn message");
    expect(mockPinoInstance.warn).toHaveBeenCalledWith("warn message");
  });
});

describe("logMessage.error", () => {
  it("logs an Error object with err serialization and message as msg", () => {
    const error = new Error("something went wrong");
    logMessage.error(error);
    expect(mockPinoInstance.error).toHaveBeenCalledWith({ err: error }, "something went wrong");
  });

  it("preserves stack trace via the err object", () => {
    const error = new Error("oops");
    logMessage.error(error);
    const call = mockPinoInstance.error.mock.calls[0];
    expect(call[0]).toEqual({ err: error });
    expect(call[0].err.stack).toContain("oops");
  });

  it("logs a string error directly", () => {
    logMessage.error("plain error string");
    expect(mockPinoInstance.error).toHaveBeenCalledWith("plain error string");
  });

  it("serializes unknown non-string values as JSON", () => {
    logMessage.error({ code: 404, detail: "not found" });
    expect(mockPinoInstance.error).toHaveBeenCalledWith(
      JSON.stringify({ code: 404, detail: "not found" })
    );
  });

  it("falls back gracefully when JSON.stringify throws", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    logMessage.error(circular);
    const call = mockPinoInstance.error.mock.calls[0][0] as string;
    expect(call).toContain("Failed to serialize error payload");
    expect(call).toContain("[Object]");
    expect(call).toContain("[object Object]");
  });

  it("logs Error subclass instances with the err object", () => {
    class CustomError extends Error {
      code = 7;
    }
    const error = new CustomError("connect error");
    logMessage.error(error);
    expect(mockPinoInstance.error).toHaveBeenCalledWith({ err: error }, "connect error");
  });
});
