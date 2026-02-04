"use client";

import { useActionState } from "react";
import { resendVerification, sendVerification } from "@lib/server/verify";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { I18n, useTranslation } from "@i18n";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import Link from "next/link";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";
import { CodeEntry } from "@clientComponents/forms/CodeEntry";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { Alert as AlertNotification, Button } from "@clientComponents/globals";
import { validateCode } from "@lib/validationSchemas";

const SUPPORT_URL = process.env.NEXT_PUBLIC_FORMS_PRODUCTION_URL || "";

type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    code?: string;
  };
};

export function VerifyEmailForm({
  userId,
  loginName,
  organization,
  requestId,
  code,
  isInvite,
  children,
}: {
  userId: string;
  loginName?: string;
  organization?: string;
  code?: string;
  isInvite: boolean;
  requestId?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const {
    t,
    i18n: { language },
  } = useTranslation("verify");

  const [error, setError] = useState<string>("");

  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);

  async function resendCode() {
    setError("");
    setCodeLoading(true);

    try {
      const response = await resendVerification({
        userId,
        isInvite: isInvite,
      });

      if (response && "error" in response && response.error) {
        setError(response.error);
      } else {
        setCodeSent(true);
      }
    } catch {
      setError(t("errors.couldNotResendEmail"));
    } finally {
      setCodeLoading(false);
    }
  }

  useEffect(() => {
    if (code) {
      sendVerification({
        code: code,
        userId,
        isInvite: isInvite,
        loginName: loginName,
        organization: organization,
        requestId: requestId,
      });
    }
  }, [code, userId, isInvite, loginName, organization, requestId]);

  const localFormAction = async (previousState: FormState, formData: FormData) => {
    const code = (formData.get("code") as string) || "";

    // Validate form entries and map any errors to form state with translated messages
    const validationResult = await validateCode({ code });
    if (!validationResult.success) {
      return {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: t(`validation.${issue.message}`),
        })),
        formData: { code },
      };
    }

    const response = await sendVerification({
      code: code,
      userId,
      isInvite: isInvite,
      loginName: loginName,
      organization: organization,
      requestId: requestId,
    });

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
        <Alert
          type={ErrorStatus.ERROR}
          // heading={state.authError.title}
          focussable={true}
          id="zitadelError"
        >
          <I18n i18nKey={state.error} namespace="verify" />
          {/* {state.authError.callToActionLink ? (
            <Link href={state.authError.callToActionLink}>{state.authError.callToActionText}</Link>
          ) : undefined} */}
        </Alert>
      )}
      {/* {state.error && (
        <div className="py-4" data-testid="error">
          <Alert.Danger>
            <p className="mt-3 font-bold">{state.error}</p>
          </Alert.Danger>
        </div>
      )} */}

      <ErrorSummary id="errorSummary" validationErrors={state.validationErrors} />

      {children}

      {error && (
        <div className="py-4" data-testid="warning">
          <AlertNotification.Warning>
            <p className="mt-3 font-bold">{error}</p>
          </AlertNotification.Warning>
        </div>
      )}

      {(codeLoading || codeSent) && (
        <AlertNotification.Info>
          <p className="mt-3 font-bold">
            {codeLoading && <I18n i18nKey="sendingNewCode" namespace="verify" />}
            {codeSent && <I18n i18nKey="sentNewCode" namespace="verify" />}
          </p>
        </AlertNotification.Info>
      )}

      <div className="w-full">
        <form action={formAction} noValidate>
          <CodeEntry state={state} code={code ?? ""} className="mt-10" />

          <div className="mb-6 mt-8 flex items-center gap-4">
            <Button
              theme="link"
              type="button"
              onClick={() => resendCode()}
              disabled={codeLoading}
              data-testid="resend-button"
            >
              <I18n i18nKey="newCode" namespace="verify" />
            </Button>
            <Link href={`${SUPPORT_URL}/${language}/support`}>
              <I18n i18nKey="help" namespace="verify" />
            </Link>
          </div>

          <SubmitButtonAction>
            <I18n i18nKey="submit" namespace="verify" />
          </SubmitButtonAction>
        </form>
      </div>
    </>
  );
}
