"use client";

import { useActionState } from "react";
import { resetPassword } from "@lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@i18n";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { submitPasswordForm } from "../actions";

type Props = {
  loginName: string;
  organization?: string;
  requestId?: string;
};

type FormState = {
  error?: string;
};

export function PasswordForm({ loginName, organization, requestId }: Props) {
  const { t } = useTranslation(["password", "common"]);

  const [info, setInfo] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    setLoading(true);

    const password = formData?.get("password");

    if (typeof password !== "string") {
      return {
        error: "Invalid Field",
      };
    }

    const response = await submitPasswordForm({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password },
      }),
      requestId,
    })
      .catch(() => {
        return {
          error: t("errors.couldNotVerifyPassword"),
        };
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      return response;
    }

    if (response && "redirect" in response && response.redirect) {
      router.push(response.redirect);
    }
    return previousState;
  };

  const [, formAction] = useActionState(localFormAction, {});

  async function resetPasswordAndContinue() {
    setError("");
    setInfo("");
    setLoading(true);

    const response = await resetPassword({
      loginName,
      organization,
      requestId,
    })
      .catch(() => {
        setError(t("errors.couldNotResetPassword"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response) {
      setError(response.error);
      return;
    }

    setInfo(t("verify.info.passwordResetSent"));

    const params = new URLSearchParams({
      loginName: loginName,
    });

    if (organization) {
      params.append("organization", organization);
    }

    if (requestId) {
      params.append("requestId", requestId);
    }

    return router.push("/password/set?" + params);
  }

  return (
    <form action={formAction}>
      <div>
        <div className="gcds-input-wrapper">
          <Label id={"label-password"} htmlFor={"password"} className="required" required>
            {t("verify.form.label")}
          </Label>
          <TextInput type={"password"} id={"password"} required defaultValue={""} />

          <button
            onClick={() => resetPasswordAndContinue()}
            type="button"
            disabled={loading}
            data-testid="reset-button"
          >
            {t("verify.form.resetPassword")}
          </button>

          {loginName && (
            <input type="hidden" name="loginName" autoComplete="username" value={loginName} />
          )}
        </div>
      </div>

      {info && (
        <div className="py-4">
          <Alert type={ErrorStatus.INFO}>{info}</Alert>
        </div>
      )}

      {error && (
        <div className="py-4" data-testid="error">
          <Alert type={ErrorStatus.ERROR}>{error}</Alert>
        </div>
      )}

      <SubmitButtonAction>{t("button.continue")}</SubmitButtonAction>
    </form>
  );
}
