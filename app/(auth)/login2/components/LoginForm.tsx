"use client";

import { useActionState, useState } from "react";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { useTranslation } from "@i18n";
import { useRouter } from "next/navigation";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { submitLoginForm } from "../actions";
import { buildUrlWithRequestId } from "@lib/utils";
import Link from "next/link";

type Props = {
  requestId?: string;
};

type FormState = {
  formData: {
    username: string;
  };
  error?: string;
};

export function LoginForm({ requestId }: Props) {
  const { t } = useTranslation(["start", "common"]);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    setLoading(true);

    const username = (formData?.get("username") as string) || "";
    const password = formData?.get("password") as string;

    // Basic client-side validation
    if (!username || !password) {
      setLoading(false);
      return {
        ...previousState,
        error: !username ? t("validation.requiredUsername") : t("validation.requiredPassword"),
        formData: { username },
      };
    }

    const response = await submitLoginForm({
      loginName: username,
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
        error: response.error,
        formData: { username },
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
    },
  });

  return (
    <div>
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
            <TextInput
              type={"email"}
              id={"username"}
              required
              autoComplete={"email"}
              defaultValue={state.formData?.username || ""}
            />
          </div>
        </div>

        {/* Password field */}
        <div className="mb-4">
          <div className="gcds-input-wrapper">
            <Label id={"label-password"} htmlFor={"password"} className="required" required>
              {t("form.passwordLabel")}
            </Label>
            <TextInput
              type={"password"}
              id={"password"}
              required
              autoComplete={"current-password"}
            />

            {/* Forgot password link */}
            <div className="mt-2">
              <Link
                href={buildUrlWithRequestId("/password/set", requestId)}
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
