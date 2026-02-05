"use client";
import { useActionState } from "react";
import { updateSession } from "@lib/server/session";
import { create } from "@zitadel/client";
import { RequestChallengesSchema } from "@zitadel/proto/zitadel/session/v2/challenge_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { I18n, useTranslation } from "@i18n";

import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { CodeEntry } from "@clientComponents/forms/CodeEntry";
import Link from "next/link";
import { Alert as AlertNotification, Button } from "@clientComponents/globals";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";
import { handleOTPFormSubmit, FormState } from "./action";

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
  } = useTranslation(["otp", "common"]);
  const [, setError] = useState<string>("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const router = useRouter();
  const initialized = useRef(false);

  async function updateSessionForOTPChallenge() {
    let challenges;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    if (method === "email") {
      challenges = create(RequestChallengesSchema, {
        otpEmail: {
          deliveryType: {
            case: "sendCode",
            value: host
              ? {
                  urlTemplate:
                    `${host.includes("localhost") ? "http://" : "https://"}${host}${basePath}/otp/${method}?code={{.Code}}&userId={{.UserID}}&sessionId={{.SessionID}}` +
                    (requestId ? `&requestId=${requestId}` : ""),
                }
              : {},
          },
        },
      });
    }

    const response = await updateSession({
      loginName,
      sessionId,
      organization,
      challenges,
      requestId,
    }).catch(() => {
      setError("Could not request OTP challenge");
      return;
    });

    if (response && "error" in response && response.error) {
      setError(response.error);
      return;
    }

    return response;
  }

  useEffect(() => {
    if (!initialized.current && ["email"].includes(method) && !code) {
      initialized.current = true;
      updateSessionForOTPChallenge().catch((error) => {
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
    updateSessionForOTPChallenge()
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

      {(codeLoading || codeSent) && (
        <AlertNotification.Info className="mt-8">
          {codeLoading && (
            <I18n
              i18nKey="sendingNewCode"
              namespace="verify"
              tagName="p"
              className="mt-3 font-bold"
            />
          )}
          {codeSent && (
            <I18n i18nKey="sentNewCode" namespace="verify" className="mt-3 font-bold" tagName="p" />
          )}
        </AlertNotification.Info>
      )}

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
          {["email"].includes(method) && (
            <Button
              theme="link"
              type="button"
              onClick={() => resendCode()}
              data-testid="resend-button"
            >
              <I18n i18nKey="newCode" namespace="verify" />
            </Button>
          )}
          <Link href={`${SUPPORT_URL}/${language}/support`}>
            <I18n i18nKey="help" namespace="verify" />
          </Link>
        </div>
      </div>
    </>
  );
}
