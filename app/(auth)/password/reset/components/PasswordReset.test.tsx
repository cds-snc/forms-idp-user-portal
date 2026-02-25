import { useRouter } from "next/navigation";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword, sendPassword } from "@lib/server/password";
import { useTranslation } from "@i18n";

import { createRouterStub, createTranslationStub } from "../../../../../test/helpers/client";

import { PasswordReset } from "./PasswordReset";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@i18n", () => ({
  useTranslation: vi.fn(),
}));

vi.mock("@i18n/client", () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
  })),
  LANGUAGE_COOKIE_NAME: "i18next",
}));

vi.mock("@lib/server/password", () => ({
  changePassword: vi.fn(),
  sendPassword: vi.fn(),
}));

vi.mock("@zitadel/client", () => ({
  create: vi.fn((_schema, payload) => payload),
}));

vi.mock("@components/auth/password-validation/PasswordValidationForm", () => ({
  PasswordValidationForm: ({
    successCallback,
  }: {
    successCallback: ({ password, code }: { password: string; code?: string }) => Promise<void>;
  }) => (
    <button onClick={() => successCallback({ password: "P@ssw0rd", code: "123456" })} type="button">
      submit-password-reset
    </button>
  ),
}));

describe("PasswordReset", () => {
  const router = createRouterStub();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRouter).mockReturnValue(router);
    vi.mocked(useTranslation).mockReturnValue(createTranslationStub() as never);

    vi.mocked(changePassword).mockResolvedValue({ success: true } as never);
    vi.mocked(sendPassword).mockResolvedValue({ redirect: "/account?requestId=req-123" } as never);
  });

  it("shows missing information error when password complexity settings are absent", () => {
    render(<PasswordReset userId="user-123" />);

    expect(screen.getByText("reset.errors.missingRequiredInformation")).toBeInTheDocument();
  });

  it("submits password reset and redirects when password verification succeeds", async () => {
    const user = userEvent.setup();

    render(
      <PasswordReset
        userId="user-123"
        loginName="person@canada.ca"
        organization="org-1"
        passwordComplexitySettings={{} as never}
      />
    );

    await user.click(screen.getByRole("button", { name: "submit-password-reset" }));

    await waitFor(
      () => {
        expect(changePassword).toHaveBeenCalledWith({
          userId: "user-123",
          password: "P@ssw0rd",
          code: "123456",
        });
        expect(sendPassword).toHaveBeenCalledWith({
          loginName: "person@canada.ca",
          organization: "org-1",
          checks: {
            password: {
              password: "P@ssw0rd",
            },
          },
        });
        expect(router.push).toHaveBeenCalledWith("/account?requestId=req-123");
      },
      { timeout: 2500 }
    );
  });

  it("shows error message when changePassword returns an error", async () => {
    const user = userEvent.setup();

    vi.mocked(changePassword).mockResolvedValue({
      error: "reset.errors.couldNotSetPassword",
    } as never);

    render(<PasswordReset userId="user-123" passwordComplexitySettings={{} as never} />);

    await user.click(screen.getByRole("button", { name: "submit-password-reset" }));

    await waitFor(
      () => {
        expect(screen.getByText("reset.errors.couldNotSetPassword")).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
    expect(sendPassword).not.toHaveBeenCalled();
  });

  it("shows verification error when sendPassword rejects", async () => {
    const user = userEvent.setup();

    vi.mocked(sendPassword).mockRejectedValue(new Error("network"));

    render(
      <PasswordReset
        userId="user-123"
        loginName="person@canada.ca"
        organization="org-1"
        passwordComplexitySettings={{} as never}
      />
    );

    await user.click(screen.getByRole("button", { name: "submit-password-reset" }));

    await waitFor(
      () => {
        expect(screen.getByText("reset.errors.couldNotVerifyPassword")).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});
