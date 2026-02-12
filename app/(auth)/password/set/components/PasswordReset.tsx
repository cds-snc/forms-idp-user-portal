"use client";
import { useState } from "react";
import { useTranslation } from "@i18n";
import { useRouter } from "next/navigation";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";

import { PasswordValidationForm } from "@components/PasswordValidation/PasswordValidationForm";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { changePassword, sendPassword } from "@lib/server/password";

export function PasswordReset({
  userId,
  passwordComplexitySettings,
  organization,
  loginName,
}: {
  userId?: string;
  passwordComplexitySettings?: PasswordComplexitySettings;
  organization?: string;
  loginName?: string;
}) {
  const { t } = useTranslation(["password"]);
  const router = useRouter();
  const [error, setError] = useState("");

  const submitPasswordForm = async ({ password, code }: { password: string; code?: string }) => {
    if (!userId) return;

    const payload: { userId: string; password: string; code?: string } = {
      userId: userId,
      password,
      ...(code ? { code } : {}),
    };

    const changeResponse = await changePassword(payload).catch(() =>
      setError("rest.errors.couldNotSetPassword")
    );

    if (changeResponse && "error" in changeResponse) {
      setError(changeResponse.error);
      return;
    }

    if (!changeResponse) {
      setError(t("reset.errors.couldNotSetPassword"));
      return;
    }

    const passwordResponse = await sendPassword({
      loginName: loginName ?? "",
      organization,
      checks: create(ChecksSchema, {
        password: { password },
      }),
    }).catch(() => setError(t("reset.errors.couldNotVerifyPassword")));

    if (passwordResponse && "error" in passwordResponse && passwordResponse.error) {
      setError(passwordResponse.error);
      return;
    }

    if (passwordResponse && "redirect" in passwordResponse && passwordResponse.redirect) {
      router.push(passwordResponse.redirect);
    }
  };

  if (!userId || !passwordComplexitySettings) {
    return <Alert type={ErrorStatus.ERROR}>{t("reset.errors.missingRequiredInformation")}</Alert>;
  }

  return (
    <>
      {error && <Alert type={ErrorStatus.ERROR}>{error}</Alert>}
      <PasswordValidationForm
        passwordComplexitySettings={passwordComplexitySettings}
        successCallback={submitPasswordForm}
        requireConfirmationCode={true}
      />
    </>
  );
}
