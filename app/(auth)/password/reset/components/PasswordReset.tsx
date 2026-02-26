"use client";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { useState } from "react";
import { useRouter } from "next/navigation";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { changePassword, sendPassword } from "@lib/server/password";
import { useTranslation } from "@i18n";
import { PasswordValidationForm } from "@components/auth/password-validation/PasswordValidationForm";
import { Alert, ErrorStatus } from "@components/ui/form";
export function PasswordReset({
  userId,
  passwordComplexitySettings,
  organization,
  loginName,
}: {
  userId: string;
  passwordComplexitySettings?: PasswordComplexitySettings;
  organization?: string;
  loginName?: string;
}) {
  const { t } = useTranslation(["password"]);
  const router = useRouter();
  const [error, setError] = useState("");
  const [formResetKey, setFormResetKey] = useState(0);

  const setErrorAndResetForm = (message: string) => {
    setError(message);
    setFormResetKey((previous) => previous + 1);
  };

  const submitPasswordForm = async ({ password, code }: { password: string; code?: string }) => {
    const payload: { userId: string; password: string; code?: string } = {
      userId: userId,
      password,
      ...(code ? { code } : {}),
    };

    const changeResponse = await changePassword(payload).catch(() => {
      setErrorAndResetForm(t("reset.errors.couldNotSetPassword"));
    });

    if (changeResponse && "error" in changeResponse) {
      setErrorAndResetForm(changeResponse.error);
      return;
    }

    if (!changeResponse) {
      setErrorAndResetForm(t("reset.errors.couldNotSetPassword"));
      return;
    }

    const passwordResponse = await sendPassword({
      loginName: loginName ?? "",
      organization,
      checks: create(ChecksSchema, {
        password: { password },
      }),
    }).catch(() => {
      setErrorAndResetForm(t("reset.errors.couldNotVerifyPassword"));
    });

    if (passwordResponse && "error" in passwordResponse && passwordResponse.error) {
      setErrorAndResetForm(passwordResponse.error);
      return;
    }

    if (passwordResponse && "redirect" in passwordResponse && passwordResponse.redirect) {
      router.push(passwordResponse.redirect);
    }
  };

  if (!passwordComplexitySettings) {
    return <Alert type={ErrorStatus.ERROR}>{t("reset.errors.missingRequiredInformation")}</Alert>;
  }

  return (
    <>
      {error && <Alert type={ErrorStatus.ERROR}>{error}</Alert>}
      <PasswordValidationForm
        key={formResetKey}
        passwordComplexitySettings={passwordComplexitySettings}
        successCallback={submitPasswordForm}
        requireConfirmationCode={true}
      />
    </>
  );
}
