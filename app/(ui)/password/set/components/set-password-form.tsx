"use client";

import {
  lowerCaseValidator,
  numberValidator,
  symbolValidator,
  upperCaseValidator,
} from "@lib/validators";
import { changePassword, resetPassword, sendPassword } from "@lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useRouter } from "next/navigation";
import { PasswordComplexity } from "../../components/password-complexity";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction, BackButton } from "@clientComponents/globals/Buttons";
import { useState, useActionState } from "react";
import { useTranslation, I18n } from "@i18n";

type Props = {
  code?: string;
  passwordComplexitySettings: PasswordComplexitySettings;
  loginName: string;
  userId: string;
  organization?: string;
  requestId?: string;
  codeRequired: boolean;
};

export function SetPasswordForm({
  passwordComplexitySettings,
  organization,
  requestId,
  loginName,
  userId,
  codeRequired,
}: Props) {
  const { t } = useTranslation("password");

  const [loading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();

  async function resendCode() {
    setError("");

    const response = await resetPassword({
      loginName,
      organization,
      requestId,
    }).catch(() => {
      setError(t("set.errors.couldNotResetPassword"));
      return;
    });

    if (response && "error" in response) {
      setError(response.error);
      return;
    }
  }

  const localFormAction = async (previousState: { error?: string }, formData: FormData) => {
    const password = formData?.get("password");

    if (typeof password !== "string") {
      return {
        error: "Invalid Field",
      };
    }

    let payload: { userId: string; password: string; code?: string } = {
      userId: userId,
      password,
    };

    // this is not required for initial password setup
    if (codeRequired) {
      const code = formData?.get("code");

      if (typeof code !== "string") {
        return {
          error: "Invalid Field",
        };
      }
      payload = { ...payload, code };
    }

    const changeResponse = await changePassword(payload).catch(() => {
      return {
        error: t("set.errors.couldNotSetPassword"),
      };
    });

    if (changeResponse && "error" in changeResponse) {
      return {
        error: changeResponse.error,
      };
    }

    if (!changeResponse) {
      return {
        error: t("set.errors.couldNotSetPassword"),
      };
    }

    const params = new URLSearchParams({});

    if (loginName) {
      params.append("loginName", loginName);
    }
    if (organization) {
      params.append("organization", organization);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for a second to avoid eventual consistency issues with an initial password being set

    const passwordResponse = await sendPassword({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password },
      }),
      requestId,
    }).catch(() => {
      return {
        error: t("set.errors.couldNotVerifyPassword"),
      };
    });

    if (passwordResponse && "error" in passwordResponse && passwordResponse.error) {
      return {
        error: passwordResponse.error,
      };
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
        {codeRequired && (
          <Alert type={ErrorStatus.INFO}>
            <div className="flex flex-row">
              <span className="mr-auto flex-1 text-left">
                <I18n i18nKey="set.noCodeReceived" namespace="password" />
              </span>
              <button
                aria-label="Resend OTP Code"
                disabled={loading}
                type="button"
                className="ml-4 cursor-pointer text-primary-light-500 hover:text-primary-light-400 disabled:cursor-default disabled:text-gray-400 dark:text-primary-dark-500 hover:dark:text-primary-dark-400 dark:disabled:text-gray-700"
                onClick={() => {
                  resendCode();
                }}
                data-testid="resend-button"
              >
                <I18n i18nKey="set.resend" namespace="password" />
              </button>
            </div>
          </Alert>
        )}
        {codeRequired && (
          <div>
            <Label htmlFor="code">{t("set.labels.code")}</Label>
            <TextInput id="code" type="text" required autoComplete="one-time-code" />
          </div>
        )}
        <div>
          <Label htmlFor="password">{t("set.labels.newPassword")}</Label>
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            required
            onChange={(e) => setWatchPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">{t("set.labels.confirmPassword")}</Label>
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
          ready
          passwordComplexitySettings={passwordComplexitySettings}
          password={watchPassword}
          equals={!!watchPassword && watchPassword === watchConfirmPassword}
        />
      )}

      {error && <Alert type={ErrorStatus.ERROR}>{error}</Alert>}
      {state.error && <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>}

      <div className="mt-8 flex w-full flex-row items-center justify-between">
        <BackButton data-testid="back-button" />
        <SubmitButtonAction
          type="submit"
          disabled={loading || !policyIsValid || watchPassword !== watchConfirmPassword}
        >
          <I18n i18nKey="set.submit" namespace="password" />
        </SubmitButtonAction>
      </div>
    </form>
  );
}
