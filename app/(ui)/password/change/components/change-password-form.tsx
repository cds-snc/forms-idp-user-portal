"use client";

import {
  lowerCaseValidator,
  numberValidator,
  symbolValidator,
  upperCaseValidator,
} from "@lib/validators";
import { checkSessionAndSetPassword, sendPassword } from "@lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useRouter } from "next/navigation";
import { useState, useActionState } from "react";
import { useTranslation, I18n } from "@i18n";

import { PasswordComplexity } from "@clientComponents/forms/PasswordCreation/PasswordComplexity";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction, BackButton } from "@clientComponents/globals/Buttons";

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
  const router = useRouter();

  const { t } = useTranslation("password");

  const [loading, setLoading] = useState<boolean>(false);

  const localFormAction = async (previousState: { error?: string }, formData: FormData) => {
    const password = formData?.get("password");

    if (typeof password !== "string") {
      return {
        error: "Invalid Field",
      };
    }
    const changeResponse = checkSessionAndSetPassword({
      sessionId,
      password,
    })
      .catch(() => {
        return {
          error: t("change.errors.couldNotChangePassword"),
        };
      })
      .finally(() => {
        setLoading(false);
      });

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
    }).catch(() => {
      return {
        error: t("change.errors.couldNotVerifyPassword"),
      };
    });

    if (passwordResponse && "error" in passwordResponse && passwordResponse.error) {
      return passwordResponse;
    }

    if (passwordResponse && "redirect" in passwordResponse && passwordResponse.redirect) {
      router.push(passwordResponse.redirect);
    }

    return previousState;
  };
  const [state, formAction] = useActionState(localFormAction, {});
  const [watchPassword, setWatchPassword] = useState("");
  const [watchConfirmPassword, setWatchConfirmPassword] = useState("");

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
          <Label htmlFor="password">{t("password.labels.newPassword")}</Label>
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
          id="password-complexity-requirements"
          passwordComplexitySettings={passwordComplexitySettings}
          password={watchPassword}
          equals={!!watchPassword && watchPassword === watchConfirmPassword}
          ready={watchPassword.length > 0}
        />
      )}

      {state.error && <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>}

      <div className="mt-8 flex w-full flex-row items-center justify-between">
        <BackButton data-testid="back-button" />
        <SubmitButtonAction
          type="submit"
          disabled={loading || !policyIsValid || watchPassword !== watchConfirmPassword}
        >
          <I18n i18nKey="change.submit" namespace="password" />
        </SubmitButtonAction>
      </div>
    </form>
  );
}
