"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert, Label, TextInput, ErrorStatus } from "@clientComponents/forms";
import { useTranslation } from "@i18n/client";
import { sendLoginname } from "@lib/server/username";
import { useRouter } from "next/navigation";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { I18n } from "@i18n";

import { ErrorMessage } from "@clientComponents/forms/ErrorMessage";

type Props = {
  loginName: string | undefined;
  requestId: string | undefined;

  organization?: string;
  suffix?: string;
  submit: boolean;
};

type FormState = {
  formData: {
    username: string;
  };
  error?: string;
};

const ValidationError = (message: string) => {
  if (!message) {
    return null;
  }
  return (
    <ErrorMessage id="username-validation-error">
      <I18n i18nKey={message} namespace="start" />
    </ErrorMessage>
  );
};

export const UserNameForm = ({ loginName, requestId, organization, suffix, submit }: Props) => {
  const { t } = useTranslation(["start", "common"]);

  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    setLoading(true);
    const username = (formData?.get("username") as string) || "";
    const result = await sendLoginname({
      loginName: username,
      organization,
      requestId,
      suffix,
    })
      .catch((error) => {
        console.error(error);
        return {
          error: "Internal Error",
          redirect: undefined,
        };
      })
      .finally(() => setLoading(false));

    if (result?.error) {
      return {
        ...previousState,
        error: result.error,
      };
    }

    if (result?.redirect) {
      router.push(result.redirect);
    }

    // Fallback if there is no error and no redirect
    return previousState;
  };

  useEffect(() => {
    if (submit && loginName) {
      // When we navigate to this page, we always want to be redirected if submit is true and the parameters are valid.
      localFormAction({ formData: { username: loginName } });
    }
  }, []);

  const [state, formAction] = useActionState(localFormAction, {
    formData: {
      username: loginName ? loginName : "",
    },
  });

  const validationError = state.error ? ValidationError(state.error) : null;

  return (
    <div>
      {state.error && (
        <Alert type={ErrorStatus.ERROR} heading={state.error} focussable={true} id="cognitoErrors">
          {state.error}
        </Alert>
      )}

      <form id="login" action={formAction} noValidate>
        <div className="mb-4">
          <div className="gcds-input-wrapper">
            <Label id={"label-username"} htmlFor={"username"} className="required" required>
              {t("form.label")}
            </Label>
            <div className="mb-4 text-sm text-black" id="login-description">
              {t("form.description")}
            </div>
            <TextInput
              validationError={validationError}
              type={"email"}
              id={"username"}
              required
              defaultValue={state.formData?.username || ""}
            />
          </div>
        </div>

        <SubmitButtonAction>{t("button.continue")}</SubmitButtonAction>
      </form>
    </div>
  );
};
