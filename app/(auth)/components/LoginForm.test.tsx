import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitLoginForm } from "../actions";

import { LoginForm } from "./LoginForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

vi.mock("@i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18n: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

vi.mock("@i18n/client", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  LANGUAGE_COOKIE_NAME: "i18next",
}));

vi.mock("../actions", () => ({
  submitLoginForm: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login fields and forgot password link", () => {
    render(<LoginForm requestId="abc123" />);

    expect(screen.getByLabelText(/form\.label/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/form\.passwordLabel/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "form.submit" })).toBeInTheDocument();

    const forgotPasswordLink = screen.getByRole("link", { name: "form.forgotPasswordLink" });
    expect(forgotPasswordLink).toHaveAttribute("href", "/password/reset?requestId=abc123");
  });

  it("shows field validation errors and does not submit invalid form", async () => {
    render(<LoginForm requestId="abc123" />);

    await userEvent.click(screen.getByRole("button", { name: "form.submit" }));

    await waitFor(() => {
      expect(screen.getAllByText("validation.requiredUsername").length).toBeGreaterThan(0);
      expect(screen.getAllByText("validation.requiredPassword").length).toBeGreaterThan(0);
    });

    expect(submitLoginForm).not.toHaveBeenCalled();
  });

  it("shows generic error when login fails", async () => {
    vi.mocked(submitLoginForm).mockResolvedValue({ error: "validation.invalidCredentials" });

    render(<LoginForm requestId="abc123" />);

    await userEvent.type(screen.getByLabelText(/form\.label/i), "person@canada.ca");
    await userEvent.type(screen.getByLabelText(/form\.passwordLabel/i), "P@ssw0rd");
    await userEvent.click(screen.getByRole("button", { name: "form.submit" }));

    await waitFor(() => {
      expect(screen.getByText("validation.invalidCredentials")).toBeInTheDocument();
    });

    expect(submitLoginForm).toHaveBeenCalledWith({
      username: "person@canada.ca",
      password: "P@ssw0rd",
      requestId: "abc123",
    });
  });

  it("redirects when login succeeds", async () => {
    vi.mocked(submitLoginForm).mockResolvedValue({ redirect: "/account?requestId=abc123" });

    render(<LoginForm requestId="abc123" />);

    await userEvent.type(screen.getByLabelText(/form\.label/i), "person@canada.ca");
    await userEvent.type(screen.getByLabelText(/form\.passwordLabel/i), "P@ssw0rd");
    await userEvent.click(screen.getByRole("button", { name: "form.submit" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/account?requestId=abc123");
    });
  });
});
