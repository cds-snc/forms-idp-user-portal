import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { validateUsername } from "@lib/validationSchemas";
import { useTranslation } from "@i18n/client";

import { submitUserNameForm } from "../actions";

import { UserNameForm } from "./UserNameForm";

vi.mock("@i18n", () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
  })),
  I18n: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

vi.mock("@i18n/client", () => ({
  useTranslation: vi.fn(),
  LANGUAGE_COOKIE_NAME: "i18next",
}));

vi.mock("@lib/validationSchemas", () => ({
  validateUsername: vi.fn(),
}));

vi.mock("../actions", () => ({
  submitUserNameForm: vi.fn(),
}));

describe("UserNameForm", () => {
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
    } as never);

    vi.mocked(validateUsername).mockResolvedValue({ success: true } as never);
    vi.mocked(submitUserNameForm).mockResolvedValue({
      userId: "user-123",
      loginName: "person@canada.ca",
    });
  });

  it("renders username field and continue button", () => {
    render(<UserNameForm organization="org-1" requestId="req-123" onSuccess={onSuccess} />);

    expect(screen.getByLabelText(/form\.label/i)).toBeInTheDocument();
    expect(screen.getByText("form.description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "button.continue" })).toBeInTheDocument();
  });

  it("shows validation error and does not submit when username is invalid", async () => {
    vi.mocked(validateUsername).mockResolvedValue({
      success: false,
      issues: [{ path: [{ key: "username" }], message: "requiredUsername" }],
    } as never);

    render(<UserNameForm organization="org-1" requestId="req-123" onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole("button", { name: "button.continue" }));

    await waitFor(() => {
      expect(screen.getByText("validation.requiredUsername")).toBeInTheDocument();
    });

    expect(submitUserNameForm).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("submits username and calls onSuccess when action succeeds", async () => {
    render(<UserNameForm organization="org-1" requestId="req-123" onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/form\.label/i), "person@canada.ca");
    await userEvent.click(screen.getByRole("button", { name: "button.continue" }));

    await waitFor(() => {
      expect(submitUserNameForm).toHaveBeenCalledWith({
        loginName: "person@canada.ca",
        organization: "org-1",
        requestId: "req-123",
      });
      expect(onSuccess).toHaveBeenCalledWith({
        userId: "user-123",
        loginName: "person@canada.ca",
      });
    });
  });

  it("shows generic error when action returns disallowed error text", async () => {
    vi.mocked(submitUserNameForm).mockResolvedValue({ error: "raw backend message" } as never);

    render(<UserNameForm organization="org-1" requestId="req-123" onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/form\.label/i), "person@canada.ca");
    await userEvent.click(screen.getByRole("button", { name: "button.continue" }));

    await waitFor(() => {
      expect(screen.getAllByText("title").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("raw backend message")).not.toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
