"use client";

import { useActionState } from "react";
import { Alert } from "@clientComponents/globals";
import { resendVerification, sendVerification } from "@lib/server/verify";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import * as v from "valibot";

import { I18n, useTranslation } from "@i18n";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import Link from "next/link";
import { Hint } from "@clientComponents/forms/Hint";
import { ErrorMessage } from "@clientComponents/forms/ErrorMessage";
import { codeSchema } from "@lib/validationSchemas";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";

type Inputs = {
  code: string;
};

type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    code?: string;
  };
};

const validateCode = async (formEntries: { [k: string]: FormDataEntryValue }) => {
  const formValidationSchema = v.pipe(
    v.object({
      ...codeSchema(),
    })
  );
  return v.safeParse(formValidationSchema, formEntries, { abortPipeEarly: true });
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

  const localFormAction = async (previousState: FormState, formData: FormData) => {
    const code = (formData.get("code") as string) || "";

    const validationResult = await validateCode({ code });
    if (!validationResult.success) {
      console.log("validationResult", validationResult);
      const temp = {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: t(`validation.${issue.message}`),
        })),
        formData: {
          code,
        },
      };

      return temp;
    }
    // if (typeof code !== "string") {
    //   return {
    //     error: "Invalid Field",
    //   };
    // }

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

  // const [state, formAction] = useActionState(localFormAction, {});

  const [state, formAction] = useActionState(localFormAction, {
    validationErrors: undefined,
    error: undefined,
    formData: {
      code: "",
    },
  });

  const getError = (fieldKey: string) => {
    return state.validationErrors?.find((e) => e.fieldKey === fieldKey)?.fieldValue || "";
  };

  return (
    <>
      <ErrorSummary id="errorSummary" validationErrors={state.validationErrors} />

      {children}

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

      <div className="w-full">
        <form action={formAction} noValidate>
          {/* <Alert.Info>
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
        </Alert.Info> */}

          <div className="mt-10">
            <Label htmlFor="code" required>
              <I18n i18nKey="label" namespace="verify" />
            </Label>
            <Hint id="codeHint">
              <I18n i18nKey="hint" namespace="verify" />
            </Hint>
            {getError("code") && (
              <ErrorMessage id={"errorMessageCode"}>{getError("code")}</ErrorMessage>
            )}
            <TextInput
              type="text"
              id="code"
              defaultValue={state.formData?.code ?? code ?? ""}
              ariaDescribedbyIds={["codeHint", "errorMessageCode"]}
              className="w-36"
              required
            />
          </div>

          <div className="mt-8 flex items-center gap-4">
            {/* TODO replace with above button that calls resendCode() and add notification somewhere */}
            <Link href="TODO">
              <I18n i18nKey="newCode" namespace="verify" />
            </Link>
            <Link href="/help">
              <I18n i18nKey="help" namespace="verify" />
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <BackButton />
            <SubmitButtonAction>
              <I18n i18nKey="submit" namespace="verify" />
            </SubmitButtonAction>
          </div>
        </form>
      </div>
    </>
  );
}
