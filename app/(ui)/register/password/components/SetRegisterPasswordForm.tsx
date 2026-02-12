"use client";
import { useState } from "react";
import { useTranslation } from "@i18n";
import { validateAccount } from "@lib/validationSchemas";
import { registerUser } from "@lib/server/register";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useRouter } from "next/navigation";

import { PasswordValidationForm } from "@components/PasswordValidation/PasswordValidationForm";
import { Alert, ErrorStatus } from "@clientComponents/forms";

export function SetRegisterPasswordForm({
  passwordComplexitySettings,
  email,
  firstname,
  lastname,
  organization,
  requestId,
}: {
  passwordComplexitySettings: PasswordComplexitySettings;
  email: string;
  firstname: string;
  lastname: string;
  organization: string;
  requestId?: string;
}) {
  const { t } = useTranslation(["password"]);
  const router = useRouter();
  const [error, setError] = useState("");

  const successCallback = async ({ password }: { password: string }) => {
    // Validate account data again to be safe
    const validateAccountData = await validateAccount({ firstname, lastname, email } as {
      [k: string]: FormDataEntryValue;
    });
    if (!validateAccountData.success) {
      setError(t("create.missingOrInvalidData.title"));
    }

    const response = await registerUser({
      email,
      firstName: firstname,
      lastName: lastname,
      password,
      organization: organization,
      requestId: requestId,
    }).catch(() => setError(t("errors.couldNotRegisterUser")));

    if (response && "error" in response && response.error) {
      setError(response.error);
      return;
    }

    if (response && "redirect" in response && response.redirect) {
      router.push(response.redirect);
    }
  };

  return (
    <>
      {error && <Alert type={ErrorStatus.ERROR}>{error}</Alert>}
      <PasswordValidationForm
        passwordComplexitySettings={passwordComplexitySettings}
        successCallback={successCallback}
      />
    </>
  );
}
