import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PasswordResetFlow } from "./PasswordResetFlow";

vi.mock("./UserNameForm", () => ({
  UserNameForm: ({
    onSuccess,
    organization,
    requestId,
  }: {
    onSuccess: (value: { userId: string; loginName: string }) => void;
    organization?: string;
    requestId?: string;
  }) => (
    <div>
      <span>{`username-form:${organization}:${requestId}`}</span>
      <button
        onClick={() => onSuccess({ userId: "user-123", loginName: "person@canada.ca" })}
        type="button"
      >
        continue-reset
      </button>
    </div>
  ),
}));

vi.mock("./PasswordReset", () => ({
  PasswordReset: ({
    userId,
    loginName,
    organization,
  }: {
    userId: string;
    loginName?: string;
    organization?: string;
  }) => <span>{`password-reset:${userId}:${loginName}:${organization}`}</span>,
}));

describe("PasswordResetFlow", () => {
  it("renders username form first", () => {
    render(
      <PasswordResetFlow
        passwordComplexitySettings={{} as never}
        organization="org-1"
        requestId="req-123"
      />
    );

    expect(screen.getByText("username-form:org-1:req-123")).toBeInTheDocument();
  });

  it("switches to password reset form after username submission succeeds", async () => {
    const user = userEvent.setup();

    render(
      <PasswordResetFlow
        passwordComplexitySettings={{} as never}
        organization="org-1"
        requestId="req-123"
      />
    );

    await user.click(screen.getByRole("button", { name: "continue-reset" }));

    expect(screen.getByText("password-reset:user-123:person@canada.ca:org-1")).toBeInTheDocument();
  });
});
