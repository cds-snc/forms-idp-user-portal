"use client";

import { useActionState } from "react";
import { Alert } from "@clientComponents/globals";
import { resendVerification, sendVerification } from "@lib/server/verify";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { I18n, useTranslation } from "@i18n";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";

type Inputs = {
  code: string;
};

type Props = {
  userId: string;
  loginName?: string;
  organization?: string;
  code?: string;
  isInvite: boolean;
  requestId?: string;
};

export function VerifyForm({ userId, loginName, organization, requestId, code, isInvite }: Props) {
  const router = useRouter();

  const { t } = useTranslation("verify");

  const [error, setError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  async function resendCode() {
    setError("");
    setLoading(true);

    const response = await resendVerification({
      userId,
      isInvite: isInvite,
    })
      .catch(() => {
        setError(t("errors.couldNotResendEmail"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response?.error) {
      setError(response.error);
      return;
    }

    return response;
  }

  const fcn = useCallback(
    async function submitCodeAndContinue(value: Inputs) {
      return sendVerification({
        code: value.code,
        userId,
        isInvite: isInvite,
        loginName: loginName,
        organization: organization,
        requestId: requestId,
      });
    },
    [isInvite, userId]
  );

  useEffect(() => {
    if (code) {
      fcn({ code });
    }
  }, [code, fcn]);

  const localFormAction = async (previousState: { error?: string }, formData: FormData) => {
    const code = formData.get("code");

    if (typeof code !== "string") {
      return {
        error: "Invalid Field",
      };
    }

    const response = await fcn({ code });

    if (response && "error" in response && response?.error) {
      return {
        error: response.error,
      };
    }

    if (response && "redirect" in response && response?.redirect) {
      router.push(response?.redirect);
    }
    return previousState;
  };

  const [state, formAction] = useActionState(localFormAction, {});

  return (
    <>
      <form className="w-full" action={formAction}>
        <Alert.Info>
          <div className="flex flex-row">
            <span className="mr-auto flex-1 text-left">
              <I18n i18nKey="verify.noCodeReceived" namespace="verify" />
            </span>
            <button
              aria-label="Resend Code"
              disabled={loading}
              type="button"
              className="ml-4 cursor-pointer text-primary-light-500 hover:text-primary-light-400 disabled:cursor-default disabled:text-gray-400 dark:text-primary-dark-500 hover:dark:text-primary-dark-400 dark:disabled:text-gray-700"
              onClick={() => {
                resendCode();
              }}
              data-testid="resend-button"
            >
              <I18n i18nKey="verify.resendCode" namespace="verify" />
            </button>
          </div>
        </Alert.Info>
        <div className="mt-4">
          <Label htmlFor="code">{t("verify.labels.code")}</Label>
          <TextInput type="text" id="code" defaultValue={code ?? ""} />
        </div>

        {error && (
          <div className="py-4" data-testid="error">
            <Alert.Warning>{error}</Alert.Warning>
          </div>
        )}
        {state.error && (
          <div className="py-4" data-testid="error">
            <Alert.Danger>{state.error}</Alert.Danger>
          </div>
        )}

        <div className="mt-8 flex w-full flex-row items-center">
          <BackButton />
          <span className="flex-grow"></span>
          <SubmitButtonAction>
            <I18n i18nKey="verify.submit" namespace="verify" />
          </SubmitButtonAction>
        </div>
      </form>
    </>
  );
}
