"use client";

import { useActionState, useState } from "react";
import { Alert, ErrorStatus, Label, TextInput } from "@components/ui/form";
import { useTranslation } from "@i18n";
import { useRouter } from "next/navigation";
import { SubmitButtonAction } from "@components/ui/button/SubmitButton";
import { submitLoginForm } from "../actions";
import { buildUrlWithRequestId } from "@lib/utils";
import Link from "next/link";
import { validateUsernameAndPassword } from "@lib/validationSchemas";
import { ErrorSummary } from "@components/ui/form/ErrorSummary";
import { ErrorMessage } from "@components/ui/form/ErrorMessage";

type Props = {
  requestId?: string;
  organization?: string;
};

type FormState = {
  formData: {
    username: string;
    password: string;
  };
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
};

export function LoginForm({ requestId }: Props) {
  const { t } = useTranslation(["start", "common"]);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    setLoading(true);

    const username = (formData?.get("username") as string) || "";
    const password = formData?.get("password") as string;

    // Validate form entries and map any errors to form state with translated messages
    const formEntriesData = formData ? Object.fromEntries(formData.entries()) : {};
    const validationResult = await validateUsernameAndPassword(formEntriesData);

    if (!validationResult.success) {
      setLoading(false);
      return {
        ...previousState,
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: t(`validation.${issue.message}`, { ns: "start" }),
        })),
        formData: {
          username: username,
          password: password,
        },
      };
    }

    const response = await submitLoginForm({
      username: username,
      password: password,
      requestId,
    })
      .catch(() => {
        return {
          error: t("validation.invalidCredentials"),
        };
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      return {
        ...previousState,
        validationErrors: undefined,
        error: response.error,
        formData: { username, password: "" },
      };
    }

    if (response && "redirect" in response && response.redirect) {
      router.push(response.redirect);
    }

    return previousState;
  };

  const [state, formAction] = useActionState(localFormAction, {
    formData: {
      username: "",
      password: "",
    },
  });

  // Helper to get field error
  const getError = (fieldKey: string) => {
    return state.validationErrors?.find((e) => e.fieldKey === fieldKey)?.fieldValue || "";
  };

  return (
    <div>
      <ErrorSummary id="errorSummary" validationErrors={state.validationErrors} />

      {state.error && (
        <div className="py-4" data-testid="error">
          <Alert type={ErrorStatus.ERROR} focussable={true} id="loginError">
            {state.error}
          </Alert>
        </div>
      )}

      <form id="login" action={formAction} noValidate>
        {/* Username field */}
        <div className="mb-4">
          <div className="gcds-input-wrapper">
            <Label id={"label-username"} htmlFor={"username"} className="required" required>
              {t("form.label")}
            </Label>
            <div className="mb-4 text-sm text-black" id="login-description">
              {t("form.description")}
            </div>
            {getError("username") && (
              <ErrorMessage id={"errorMessageUsername"}>{getError("username")}</ErrorMessage>
            )}
            <TextInput
              type={"email"}
              id={"username"}
              required
              autoComplete={"email"}
              defaultValue={state.formData?.username || ""}
              ariaDescribedbyIds={getError("username") ? ["errorMessageUsername"] : undefined}
            />
          </div>
        </div>

        {/* Password field */}
        <div className="mb-4">
          <div className="gcds-input-wrapper">
            <Label id={"label-password"} htmlFor={"password"} className="required" required>
              {t("form.passwordLabel")}
            </Label>
            {getError("password") && (
              <ErrorMessage id={"errorMessagePassword"}>{getError("password")}</ErrorMessage>
            )}
            <TextInput
              type={"password"}
              id={"password"}
              required
              autoComplete={"current-password"}
              ariaDescribedbyIds={getError("password") ? ["errorMessagePassword"] : undefined}
            />

            {/* Forgot password link */}
            <div className="mt-2">
              <Link
                href={buildUrlWithRequestId("/password/reset", requestId)}
                className="text-sm underline"
              >
                {t("form.forgotPasswordLink")}
              </Link>
            </div>
          </div>
        </div>

        <SubmitButtonAction disabled={loading}>
          {loading ? t("form.signingIn") : t("form.submit")}
        </SubmitButtonAction>
      </form>
    </div>
  );
}
