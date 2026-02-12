"use client";
import { useState } from "react";
import { useTranslation } from "@i18n";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useRouter } from "next/navigation";

import { checkSessionAndSetPassword, sendPassword } from "@lib/server/password";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { PasswordForm } from "@components/PasswordValidation/PasswordForm";

type Props = {
  passwordComplexitySettings: PasswordComplexitySettings;
  sessionId: string;
  loginName: string;
  requestId?: string;
  organization?: string;
};

export function ChangePasswordForm({
  passwordComplexitySettings,
  sessionId,
  loginName,
  requestId,
  organization,
}: Props) {
  const { t } = useTranslation("password");
  const router = useRouter();
  // const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState("");

  const successCallback = async ({ password }: { password: string }) => {
    if (typeof password !== "string") {
      setError("Invalid Field");
    }

    const changeResponse = checkSessionAndSetPassword({
      sessionId,
      password,
    }).catch(() => setError(t("change.errors.couldNotChangePassword")));
    // .finally(() => {
    //   setLoading(false);
    // });

    if (changeResponse && "error" in changeResponse && changeResponse.error) {
      return {
        error:
          typeof changeResponse.error === "string"
            ? changeResponse.error
            : t("change.errors.unknownError"),
      };
    }

    if (!changeResponse) {
      return {
        error: t("change.errors.couldNotChangePassword"),
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for a second, to prevent eventual consistency issues

    const passwordResponse = await sendPassword({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password },
      }),
      requestId,
    }).catch(() => setError(t("change.errors.couldNotVerifyPassword")));

    if (passwordResponse && "error" in passwordResponse && passwordResponse.error) {
      return passwordResponse;
    }

    if (passwordResponse && "redirect" in passwordResponse && passwordResponse.redirect) {
      router.push(passwordResponse.redirect);
    }
  };

  return (
    <>
      {error && <Alert type={ErrorStatus.ERROR}>{error}</Alert>}
      <PasswordForm
        passwordComplexitySettings={passwordComplexitySettings}
        successCallback={successCallback}
      />
    </>
  );
}
