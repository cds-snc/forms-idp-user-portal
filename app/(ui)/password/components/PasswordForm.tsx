"use client";

import { useActionState } from "react";
import { resetPassword, sendPassword } from "@lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@i18n";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";

type Props = {
  loginSettings: LoginSettings | undefined;
  loginName: string;
  organization?: string;
  requestId?: string;
};

type FormState = {
  error?: string;
};

export function PasswordForm({ loginSettings, loginName, organization, requestId }: Props) {
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

    const response = await sendPassword({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password },
      }),
      requestId,
    })
      .catch((e) => {
        console.error(e);
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

  const [state, formAction] = useActionState(localFormAction, {});

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

    setInfo(t("info.passwordResetSent"));

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
    <form className="w-2/3 pt-2" action={formAction}>
      <div className={`${error && "transform-gpu animate-shake"} gc`}>
        <Label id={"label-password"} htmlFor={"password"} className="required" required>
          {t("form.label")}
        </Label>
        <TextInput
          className="h-10 w-full min-w-full rounded-xl"
          type={"password"}
          id={"password"}
          name={"password"}
          required
          defaultValue={""}
        />
        {!loginSettings?.hidePasswordReset && (
          <button
            className="text-sm transition-all hover:text-primary-light-500 dark:hover:text-primary-dark-500"
            onClick={() => resetPasswordAndContinue()}
            type="button"
            disabled={loading}
            data-testid="reset-button"
          >
            {t("form.resetPassword")}
          </button>
        )}

        {loginName && (
          <input type="hidden" name="loginName" autoComplete="username" value={loginName} />
        )}
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

      <div className="mt-8 flex w-full flex-row items-center">
        <BackButton data-testid="back-button" />
        <span className="flex-grow"></span>
        <SubmitButtonAction>{t("button.submit")}</SubmitButtonAction>
      </div>
    </form>
  );
}
