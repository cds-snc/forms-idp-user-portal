import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PasswordResetFlow } from "./PasswordResetFlow";

vi.mock("./UserNameForm", () => ({
  UserNameForm: ({ requestId }: { requestId?: string }) => (
    <span>{`username-form:${requestId}`}</span>
  ),
}));

describe("PasswordResetFlow", () => {
  it("renders username form first", () => {
    const { getByText } = render(
      <PasswordResetFlow passwordComplexitySettings={{} as never} requestId="req-123" />
    );

    expect(getByText("username-form:org-1:req-123")).toBeInTheDocument();
  });
});
