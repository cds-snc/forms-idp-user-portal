"use client";
import { useActionState } from "react";
import { completeFlowOrGetUrl } from "@lib/client";
import { updateSession } from "@lib/server/session";
import { create } from "@zitadel/client";
import { RequestChallengesSchema } from "@zitadel/proto/zitadel/session/v2/challenge_pb";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
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
import { validateCode } from "@lib/validationSchemas";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";

const SUPPORT_URL = process.env.NEXT_PUBLIC_FORMS_PRODUCTION_URL || "";

type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    code?: string;
  };
};

type Inputs = {
  code: string;
};

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string>("");

  // TODO can probably remove most of the loading + codeLoading state
  const [, setLoading] = useState<boolean>(false);
  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);

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

    // if (method === "sms") {
    //   challenges = create(RequestChallengesSchema, {
    //     otpSms: {},
    //   });
    // }

    setLoading(true);
    const response = await updateSession({
      loginName,
      sessionId,
      organization,
      challenges,
      requestId,
    })
      .catch(() => {
        setError("Could not request OTP challenge");
        return;
      })
      .finally(() => {
        setLoading(false);
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
      setLoading(true);
      updateSessionForOTPChallenge()
        .catch((error) => {
          setError(error);
          return;
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCode(values: Inputs, organization?: string) {
    setLoading(true);

    const body: { code: string; method: string; organization?: string; requestId?: string } = {
      code: values.code,
      method,
    };

    if (organization) {
      body.organization = organization;
    }

    if (requestId) {
      body.requestId = requestId;
    }

    let checks;

    // if (method === "sms") {
    //   checks = create(ChecksSchema, {
    //     otpSms: { code: values.code },
    //   });
    // }
    if (method === "email") {
      checks = create(ChecksSchema, {
        otpEmail: { code: values.code },
      });
    }
    if (method === "time-based") {
      checks = create(ChecksSchema, {
        totp: { code: values.code },
      });
    }

    // TODO not returning anything when submitting an invalid code
    const response = await updateSession({
      loginName,
      sessionId,
      organization,
      checks,
      requestId,
    })
      .catch(() => {
        setError("Could not verify OTP code");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      setError(response.error);
      return;
    }

    return response;
  }

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    const code = (formData?.get("code") as string) ?? "";

    // Validate form entries and map any errors to form state with translated messages
    const validationResult = await validateCode({ code });
    if (!validationResult.success) {
      // TODO Move to util function
      return {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: t(`verify.validation.${issue.message}`),
        })),
        error: undefined,
        formData: { code },
      };
    }

    // TODO trime white space from code
    return submitCode({ code }, organization).then(async (response) => {
      if (response && "sessionId" in response) {
        setLoading(true);
        // Wait for 2 seconds to avoid eventual consistency issues with an OTP code being verified in the /login endpoint
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Use unified approach that handles both OIDC/SAML and regular flows
        if (response.factors?.user) {
          const callbackResponse = await completeFlowOrGetUrl(
            requestId && response.sessionId
              ? {
                  sessionId: response.sessionId,
                  requestId: requestId,
                  organization: response.factors?.user?.organizationId,
                }
              : {
                  loginName: response.factors.user.loginName,
                  organization: response.factors?.user?.organizationId,
                },
            loginSettings?.defaultRedirectUri
          );
          setLoading(false);

          if ("error" in callbackResponse) {
            return {
              validationErrors: undefined,
              formData: { code },
              error: callbackResponse.error,
            };
          }

          if ("redirect" in callbackResponse) {
            router.push(callbackResponse.redirect);
          }
        } else {
          setLoading(false);
        }
      }

      return {
        validationErrors: undefined,
        error: undefined,
        formData: { code },
      };
    });
  };

  const resendCode = async () => {
    setCodeLoading(true);
    setCodeSent(false);
    updateSessionForOTPChallenge()
      .then(() => setCodeSent(true))
      .catch((error) => {
        setError(error);
        return;
      })
      .finally(() => {
        setCodeLoading(false);
      });
  };

  // TODO Probably errasing session state in cookie :)
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
        <AlertNotification.Info>
          {codeLoading && (
            <I18n
              i18nKey="sendingNewCode"
              namespace="verify"
              tagName="p"
              className="mt-3 font-bold"
            />
          )}
          {codeSent && <I18n i18nKey="sentNewCode" namespace="verify" className="mt-3 font-bold" />}
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
              disabled={codeLoading}
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
