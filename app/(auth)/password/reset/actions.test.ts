import { headers } from "next/headers";
import { GCNotifyConnector } from "@gcforms/connectors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPasswordResetTemplate } from "@lib/emailTemplates";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { listUsers, passwordResetWithReturn } from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";

import { setupServerActionContext } from "../../../../test/helpers/serverAction";

import { submitUserNameForm } from "./actions";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@gcforms/connectors", () => ({
  GCNotifyConnector: {
    default: vi.fn(),
  },
}));

vi.mock("@lib/emailTemplates", () => ({
  getPasswordResetTemplate: vi.fn(),
}));

vi.mock("@lib/service-url", () => ({
  getServiceUrlFromHeaders: vi.fn(),
}));

vi.mock("@lib/zitadel", () => ({
  listUsers: vi.fn(),
  passwordResetWithReturn: vi.fn(),
}));

vi.mock("@i18n/server", () => ({
  serverTranslation: vi.fn(),
}));

vi.mock("@lib/logger", () => ({
  logMessage: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("submitUserNameForm", () => {
  const sendEmail = vi.fn();
  const originalNotifyApiKey = process.env.NOTIFY_API_KEY;
  const originalTemplateId = process.env.TEMPLATE_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    setupServerActionContext();

    vi.mocked(listUsers).mockResolvedValue({
      details: { totalResult: BigInt(1) },
      result: [
        {
          userId: "user-123",
          type: {
            case: "human",
            value: {
              email: {
                email: "person@canada.ca",
              },
            },
          },
        },
      ],
    } as never);

    vi.mocked(passwordResetWithReturn).mockResolvedValue({
      verificationCode: "reset-456",
    } as never);
    vi.mocked(getPasswordResetTemplate).mockReturnValue({ code: "reset-456" } as never);

    sendEmail.mockResolvedValue(undefined);
    vi.mocked(GCNotifyConnector.default).mockReturnValue({ sendEmail } as never);

    process.env.NOTIFY_API_KEY = "notify-key";
    process.env.TEMPLATE_ID = "template-123";
  });

  it("returns non-enumerating response when no matching user exists", async () => {
    vi.mocked(listUsers).mockResolvedValue({
      details: { totalResult: BigInt(0) },
      result: [],
    } as never);

    const response = await submitUserNameForm({
      loginName: "person@canada.ca",
      organization: "org-1",
      requestId: "req-123",
    });

    expect(response).toEqual({ userId: "", loginName: "person@canada.ca" });
    expect(passwordResetWithReturn).not.toHaveBeenCalled();
  });

  it("returns non-enumerating response when user has no email", async () => {
    vi.mocked(listUsers).mockResolvedValue({
      details: { totalResult: BigInt(1) },
      result: [
        {
          userId: "user-123",
          type: {
            case: "human",
            value: {},
          },
        },
      ],
    } as never);

    const response = await submitUserNameForm({ loginName: "person@canada.ca" });

    expect(response).toEqual({ userId: "", loginName: "person@canada.ca" });
    expect(passwordResetWithReturn).not.toHaveBeenCalled();
  });

  it("returns non-enumerating response when reset code is missing", async () => {
    vi.mocked(passwordResetWithReturn).mockResolvedValue({} as never);

    const response = await submitUserNameForm({ loginName: "person@canada.ca" });

    expect(response).toEqual({ userId: "", loginName: "person@canada.ca" });
  });

  it("returns non-enumerating response when notify configuration is missing", async () => {
    delete process.env.NOTIFY_API_KEY;
    delete process.env.TEMPLATE_ID;

    const response = await submitUserNameForm({ loginName: "person@canada.ca" });

    expect(response).toEqual({ userId: "", loginName: "person@canada.ca" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns non-enumerating response when email send fails", async () => {
    sendEmail.mockRejectedValue(new Error("notify unavailable"));

    const response = await submitUserNameForm({ loginName: "person@canada.ca" });

    expect(response).toEqual({ userId: "", loginName: "person@canada.ca" });
  });

  it("returns user information on successful reset code email", async () => {
    const response = await submitUserNameForm({
      loginName: "person@canada.ca",
      organization: "org-1",
      requestId: "req-123",
    });

    expect(response).toEqual({ userId: "user-123", loginName: "person@canada.ca" });
    expect(listUsers).toHaveBeenCalledWith({
      serviceUrl: "https://idp.example",
      loginName: "person@canada.ca",
      organizationId: "org-1",
    });
    expect(getPasswordResetTemplate).toHaveBeenCalledWith("reset-456");
    expect(sendEmail).toHaveBeenCalledWith("person@canada.ca", "template-123", {
      code: "reset-456",
    });
  });

  afterEach(() => {
    process.env.NOTIFY_API_KEY = originalNotifyApiKey;
    process.env.TEMPLATE_ID = originalTemplateId;
  });
});
