"use client";
import { useActionState } from "react";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { I18n, useTranslation } from "@i18n";

import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { CodeEntry } from "@clientComponents/forms/CodeEntry";
import Link from "next/link";
import { Button } from "@clientComponents/globals";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";
import { handleOTPFormSubmit, FormState, updateSessionForOTPChallenge } from "./action";

const SUPPORT_URL = process.env.NEXT_PUBLIC_FORMS_PRODUCTION_URL || "";

export function LoginOTP({
  host,
  loginName,
  sessionId,
  requestId,
  organization,
  method,
  code,
  loginSettings,
  children,
}: {
  host: string | null;
  loginName?: string; // either loginName or sessionId must be provided
  sessionId?: string;
  requestId?: string;
  organization?: string;
  method: string;
  code?: string;
  loginSettings?: LoginSettings;
  children?: React.ReactNode;
}) {
  const {
    t,
    i18n: { language },
  } = useTranslation("otp");
  const [, setError] = useState<string>("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const router = useRouter();
  const initialized = useRef(false);

  const requestOTPChallenge = async () => {
    const { error } = await updateSessionForOTPChallenge({
      host,
      loginName,
      sessionId,
      organization,
      requestId,
      method,
    });

    if (error) {
      setError(error);
    }
  };

  useEffect(() => {
    if (!initialized.current && ["email"].includes(method) && !code) {
      initialized.current = true;
      requestOTPChallenge().catch((error) => {
        setError(error);
        return;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const localFormAction = async (_: FormState, formData?: FormData) => {
    const code = (formData?.get("code") as string) ?? "";
    const result = await handleOTPFormSubmit(code, {
      loginName,
      sessionId,
      organization,
      requestId,
      method,
      loginSettings,
      t,
    });

    // Handle redirect if present
    if ("redirect" in result && result.redirect) {
      router.push(result.redirect);
    }

    return result;
  };

  const resendCode = async () => {
    setCodeSent(false);
    setCodeLoading(true);
    requestOTPChallenge()
      .then(() => setCodeSent(true))
      .catch((error) => {
        setError(error);
        return;
      })
      .finally(() => setCodeLoading(false));
  };

  const [state, formAction] = useActionState(localFormAction, {
    validationErrors: undefined,
    error: undefined,
    formData: {
      code: "",
    },
  });

  return (
    <>
      {state.error && (
        <div className="py-4" data-testid="error">
          <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>
        </div>
      )}

      <ErrorSummary id="errorSummary" validationErrors={state.validationErrors} />

      {children}

      <div className="w-full">
        <form action={formAction} noValidate>
          <CodeEntry state={state} code={code ?? ""} className="mt-8" />

          <div className="mt-6 flex items-center gap-4">
            <BackButton />
            <SubmitButtonAction>
              <I18n i18nKey="submit" namespace="verify" />
            </SubmitButtonAction>
          </div>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <Link href={`${SUPPORT_URL}/${language}/support`}>
            <I18n i18nKey="help" namespace="verify" />
          </Link>
          {["email"].includes(method) && (
            <div className="flex whitespace-nowrap">
              <Button
                theme="link"
                type="button"
                onClick={() => resendCode()}
                data-testid="resend-button"
              >
                <I18n i18nKey="newCode" namespace="verify" />
              </Button>
              {codeLoading && (
                <I18n
                  i18nKey="sendingNewCode"
                  namespace="verify"
                  tagName="p"
                  className="ml-4 text-emerald-700"
                />
              )}
              {codeSent && (
                <I18n
                  i18nKey="sentNewCode"
                  namespace="verify"
                  className="ml-4 text-emerald-700"
                  tagName="span"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
