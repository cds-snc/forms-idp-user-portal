"use client";

import { useActionState, useState } from "react";
import { Alert, Label, TextInput, ErrorStatus, ErrorListItem } from "@clientComponents/forms";
import { sendLoginname } from "@lib/server/username";
import { useRouter } from "next/navigation";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { I18n } from "@i18n";

import { ErrorMessage } from "@clientComponents/forms/ErrorMessage";
import { validateAccount } from "../../register/validation";
import { useTranslation } from "@i18n";

type Props = {
  loginName: string | undefined;
  requestId: string | undefined;

  organization?: string;
  suffix?: string;
  submit: boolean;
};

type FormState = {
  validationErrors?: { fieldKey: string; fieldValue: string }[];
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

const getTranslationStrings = (t: (key: string) => string) => {
  return {
    "errors.validation.requiredFirstname": t("errors.validation.requiredFirstname"),
    "errors.validation.requiredLastname": t("errors.validation.requiredLastname"),
    "errors.validation.requiredEmail": t("errors.validation.requiredEmail"),
    "errors.validation.validGovEmail": t("errors.validation.validGovEmail"),
  };
};

export const UserNameForm = ({ loginName, requestId, organization, suffix }: Props) => {
  const { t } = useTranslation(["start", "common"]);

  const router = useRouter();

  const [, setLoading] = useState<boolean>(false);

  const errorMessages = getTranslationStrings(t);

  const localFormAction = async (previousState: FormState, formData: FormData) => {
    setLoading(true);

    const originalFormData = {
      username: (formData?.get("username") as string) || "",
    };

    const rawFormData = Object.fromEntries(formData.entries());

    const validationResult = await validateAccount(rawFormData, errorMessages);

    if (!validationResult.success) {
      return {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: issue.message,
        })),
        formData: originalFormData,
      };
    }

    const result = await sendLoginname({
      loginName: originalFormData.username,
      organization,
      requestId,
      suffix,
    })
      .catch((error) => {
        // eslint-disable-next-line no-console
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

  const [state, formAction] = useActionState(localFormAction, {
    validationErrors: undefined,
    formData: {
      username: loginName ? loginName : "",
    },
  });

  return (
    <>
      {state.validationErrors && Object.keys(state.validationErrors).length > 0 && (
        <Alert
          className="w-full"
          type={ErrorStatus.ERROR}
          validation={true}
          tabIndex={0}
          focussable={true}
          id="registrationValidationErrors"
          heading={t("input-validation.heading", { ns: "common" })}
        >
          <ol className="gc-ordered-list p-0">
            {state.validationErrors.map(({ fieldKey, fieldValue }, index) => {
              return (
                <ErrorListItem
                  key={`error-${fieldKey}-${index}`}
                  errorKey={fieldKey}
                  value={fieldValue}
                />
              );
            })}
          </ol>
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
              validationError={ValidationError(state.error || "")}
              type={"email"}
              id={"username"}
              required
              defaultValue={state.formData?.username || ""}
            />
          </div>
        </div>

        <SubmitButtonAction>{t("button.continue")}</SubmitButtonAction>
      </form>
    </>
  );
};
