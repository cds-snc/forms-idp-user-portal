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

import { useTranslation } from "@i18n";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";

// either loginName or sessionId must be provided
type Props = {
  host: string | null;
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  method: string;
  code?: string;
  loginSettings?: LoginSettings;
};

type FormState = {
  error?: string;
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
}: Props) {
  const { t } = useTranslation(["otp", "common"]);

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && ["email", "sms"].includes(method) && !code) {
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
  }, []);

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

    if (method === "sms") {
      challenges = create(RequestChallengesSchema, {
        otpSms: {},
      });
    }

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

  async function submitCode(values: Inputs, organization?: string) {
    setLoading(true);

    let body: any = {
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

    if (method === "sms") {
      checks = create(ChecksSchema, {
        otpSms: { code: values.code },
      });
    }
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
    const value = (formData?.get("code") as string) ?? "";

    return submitCode({ code: value }, organization).then(async (response) => {
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
      return previousState;
    });
  };
  const [state, formAction] = useActionState(localFormAction, {});
  return (
    <form className="w-2/3" action={formAction}>
      {["email", "sms"].includes(method) && (
        <Alert type={ErrorStatus.INFO}>
          <div className="flex flex-row">
            <span className="mr-auto flex-1 text-left">{t("verify.form.noCodeReceived")}</span>
            <button
              aria-label="Resend OTP Code"
              disabled={loading}
              type="button"
              className="ml-4 cursor-pointer text-primary-light-500 hover:text-primary-light-400 disabled:cursor-default disabled:text-gray-400 dark:text-primary-dark-500 hover:dark:text-primary-dark-400 dark:disabled:text-gray-700"
              onClick={() => {
                setLoading(true);
                updateSessionForOTPChallenge()
                  .catch((error) => {
                    setError(error);
                    return;
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
              data-testid="resend-button"
            >
              {t("verify.form.resendCode")}
            </button>
          </div>
        </Alert>
      )}
      <div className="mt-4">
        <Label id={"label-otp"} htmlFor={"code"} className="required" required>
          {t("verify.form.label")}
        </Label>
        <TextInput
          className="h-10 w-full min-w-full rounded-xl"
          type={"text"}
          id={"code"}
          name={"code"}
          required
          defaultValue={""}
        />
      </div>

      {state.error && (
        <div className="py-4" data-testid="error">
          <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>
        </div>
      )}

      <div className="mt-8 flex w-full flex-row items-center">
        <BackButton data-testid="back-button" />
        <span className="flex-grow"></span>
        <SubmitButtonAction>{t("button.submit")}</SubmitButtonAction>
      </div>
    </form>
  );
}
