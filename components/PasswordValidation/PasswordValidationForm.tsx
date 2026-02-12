"use client";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useActionState, useState } from "react";
import { I18n, useTranslation } from "@i18n";
import * as v from "valibot";

import { Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { Hint } from "@clientComponents/forms/Hint";
import { confirmPasswordSchema, passwordSchema } from "@lib/validationSchemas";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";
import { ErrorMessage } from "@clientComponents/forms/ErrorMessage";
import { PasswordComplexity } from "./PasswordComplexity";

type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    password?: string;
    confirmPassword?: string;
  };
};

const validateCreatePassword = async (
  formEntries: { [k: string]: FormDataEntryValue },
  passwordComplexitySettings = {}
) => {
  const passwordValidationSchema = v.pipe(
    v.object({
      ...passwordSchema(passwordComplexitySettings),
      ...confirmPasswordSchema(),
    }),
    v.forward(
      v.check((input) => input.password === input.confirmPassword, "mustMatch"),
      ["confirmPassword"]
    )
  );
  return v.safeParse(passwordValidationSchema, formEntries, { abortPipeEarly: true });
};

export function PasswordValidationForm({
  passwordComplexitySettings,
  successCallback,
}: {
  passwordComplexitySettings: PasswordComplexitySettings;
  successCallback?: ({ password }: { password: string }) => void;
}) {
  const { t } = useTranslation(["password"]);

  const [watchPassword, setWatchPassword] = useState("");
  // const [watchConfirmPassword, setWatchConfirmPassword] = useState("");

  // TODO could also be a client (not server) function
  const localFormAction = async (previousState: FormState, formData: FormData) => {
    const formEntries = {
      password: (formData.get("password") as string) || "",
      confirmPassword: (formData.get("confirmPassword") as string) || "",
    };

    // Validate form entries and map any errors to form state with translated messages
    const formEntriesData = Object.fromEntries(formData.entries());
    const validationResult = await validateCreatePassword(
      formEntriesData,
      passwordComplexitySettings
    );
    if (!validationResult.success) {
      return {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: t(`complexity.${issue.message}`),
        })),
        formData: formEntries,
      };
    }

    if (validationResult.success) {
      successCallback?.({ password: formEntries.password as string });
    }

    return previousState;
  };

  const [state, formAction] = useActionState(localFormAction, {
    error: undefined,
    validationErrors: undefined,
    formData: {
      password: "",
      confirmPassword: "",
    },
  });

  const getError = (fieldKey: string) => {
    return state.validationErrors?.find((e) => e.fieldKey === fieldKey)?.fieldValue || "";
  };

  const [dirty, setDirty] = useState(false);

  return (
    <>
      <ErrorSummary id="errorSummary" validationErrors={state.validationErrors} />
      <form className="w-full" action={formAction} noValidate onChange={() => setDirty(true)}>
        <div className="mb-4 grid grid-cols-1 gap-4 pt-4">
          <div className="gcds-input-wrapper">
            <Label htmlFor="password" required>
              {t("create.labels.password")}
            </Label>
            {getError("password") && (
              <ErrorMessage id={"errorMessagePassword"}>{t(getError("password"))}</ErrorMessage>
            )}
            <Hint>
              <div className="mb-2">
                <I18n i18nKey="create.passwordHint" namespace="password" />
              </div>
              {passwordComplexitySettings && (
                <PasswordComplexity
                  passwordComplexitySettings={passwordComplexitySettings}
                  password={watchPassword}
                  // equals={!!watchPassword && watchPassword === watchConfirmPassword}
                  id="password-complexity-requirements"
                  ready={dirty}
                />
              )}
            </Hint>
            <TextInput
              id="password"
              className="w-full"
              type="password"
              required
              ariaDescribedbyIds={["password-complexity-requirements"]}
              defaultValue={state.formData?.password ?? ""}
              onChange={(e) => setWatchPassword(e.target.value)}
            />
          </div>
          <div className="gcds-input-wrapper">
            <Label htmlFor="confirmPassword" required>
              {t("create.labels.confirmPassword")}
            </Label>
            {getError("confirmPassword") && (
              <ErrorMessage id={"errorMessageConfirmPassword"}>
                {getError("confirmPassword")}
              </ErrorMessage>
            )}
            <TextInput
              id="confirmPassword"
              className="w-full"
              type="password"
              required
              defaultValue={state.formData?.confirmPassword ?? ""}
              // onChange={(e) => setWatchConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <SubmitButtonAction>{t("button.continue", { ns: "common" })}</SubmitButtonAction>
      </form>
    </>
  );
}
