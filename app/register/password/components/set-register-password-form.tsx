"use client";

import {
  lowerCaseValidator,
  numberValidator,
  symbolValidator,
  upperCaseValidator,
} from "@lib/validators";
import { registerUser } from "@lib/server/register";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { useTranslation } from "@i18n";

import { PasswordComplexity } from "./password-complexity";

import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";

type Props = {
  passwordComplexitySettings: PasswordComplexitySettings;
  email: string;
  firstname: string;
  lastname: string;
  organization: string;
  requestId?: string;
};

type PasswordParams = {
  password?: string;
  confirmPassword?: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
  requestId?: string;
};

export function SetRegisterPasswordForm({
  passwordComplexitySettings,
  email,
  firstname,
  lastname,
  organization,
  requestId,
}: Props) {
  const { t } = useTranslation("register");

  const router = useRouter();
  const [watchPassword, setWatchPassword] = useState("");
  const [watchConfirmPassword, setWatchConfirmPassword] = useState("");

  const localFormAction = async (formState: { error?: string }, formData: FormData) => {
    const fields: (keyof PasswordParams)[] = ["password"];
    const passwordParams: PasswordParams = {
      email: email,
      firstName: firstname,
      lastName: lastname,
      organization: organization,
      requestId: requestId,
    };

    fields.forEach((field) => {
      const value = formData?.get(field);
      if (typeof value !== "string") {
        return {
          error: "Invalid Field",
        };
      }
      passwordParams[field] = value;
    });

    const response = await registerUser({
      ...passwordParams,
    }).catch(() => {
      return {
        error: t("errors.couldNotRegisterUser"),
      };
    });

    if (response && "error" in response && response.error) {
      return {
        error: response.error,
      };
    }

    if (response && "redirect" in response && response.redirect) {
      router.push(response.redirect);
    }

    return formState;
  };

  const [state, formAction] = useActionState(localFormAction, {});

  const hasMinLength =
    passwordComplexitySettings && watchPassword?.length >= passwordComplexitySettings.minLength;
  const hasSymbol = symbolValidator(watchPassword);
  const hasNumber = numberValidator(watchPassword);
  const hasUppercase = upperCaseValidator(watchPassword);
  const hasLowercase = lowerCaseValidator(watchPassword);

  const policyIsValid =
    passwordComplexitySettings &&
    (passwordComplexitySettings.requiresLowercase ? hasLowercase : true) &&
    (passwordComplexitySettings.requiresNumber ? hasNumber : true) &&
    (passwordComplexitySettings.requiresUppercase ? hasUppercase : true) &&
    (passwordComplexitySettings.requiresSymbol ? hasSymbol : true) &&
    hasMinLength;

  return (
    <form className="w-full" action={formAction}>
      <div className="mb-4 grid grid-cols-1 gap-4 pt-4">
        <div className="">
          <Label htmlFor="password">{t("password.labels.password")}</Label>
          <TextInput
            id="password"
            type="password"
            required
            onChange={(e) => setWatchPassword(e.target.value)}
          />
        </div>
        <div className="">
          <Label htmlFor="confirmPassword">{t("password.labels.confirmPassword")}</Label>
          <TextInput
            type="password"
            required
            id="confirmPassword"
            onChange={(e) => setWatchConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      {passwordComplexitySettings && (
        <PasswordComplexity
          passwordComplexitySettings={passwordComplexitySettings}
          password={watchPassword}
          equals={!!watchPassword && watchPassword === watchConfirmPassword}
        />
      )}

      {state.error && <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>}

      <div className="mt-8 flex w-full flex-row items-center justify-between">
        <BackButton data-testid="back-button" />
        <SubmitButtonAction disabled={!policyIsValid || watchPassword !== watchConfirmPassword}>
          {t("password.submit")}
        </SubmitButtonAction>
      </div>
    </form>
  );
}
