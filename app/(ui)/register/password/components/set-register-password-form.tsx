"use client";
import { registerUser } from "@lib/server/register";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { I18n, useTranslation } from "@i18n";
import * as v from "valibot";

import { PasswordComplexity } from "../../../password/components/password-complexity";

import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { Hint } from "@clientComponents/forms/Hint";
import { confirmPasswordSchema, passwordSchema } from "@lib/validationSchemas";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";
import { ErrorMessage } from "@clientComponents/forms/ErrorMessage";

type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    password?: string;
    confirmPassword?: string;
  };
};

type Props = {
  passwordComplexitySettings: PasswordComplexitySettings;
  email: string;
  firstname: string;
  lastname: string;
  organization: string;
  requestId?: string;
};

// type PasswordParams = {
//   password?: string;
//   confirmPassword?: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   organization: string;
//   requestId?: string;
// };

const validatePassword = async (
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
  const temp = v.safeParse(passwordValidationSchema, formEntries, { abortPipeEarly: true });
  return temp;
};

export function SetRegisterPasswordForm({
  passwordComplexitySettings,
  email,
  firstname,
  lastname,
  organization,
  requestId,
}: Props) {
  const { t } = useTranslation(["password"]);

  const router = useRouter();
  const [watchPassword, setWatchPassword] = useState("");
  const [watchConfirmPassword, setWatchConfirmPassword] = useState("");

  const localFormAction = async (formState: FormState, formData: FormData) => {
    const formEntries = {
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const formEntriesData = Object.fromEntries(formData.entries());

    const validationResult = await validatePassword(formEntriesData, passwordComplexitySettings);
    if (!validationResult.success) {
      return {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          // TODO put back once translations are done
          // fieldValue: t(issue.message || "required", { ns: "validation" }),
          fieldValue: t(`complexity.${issue.message}`),
        })),
        formData: {
          password: typeof formEntries.password === "string" ? formEntries.password : "",
          confirmPassword:
            typeof formEntries.confirmPassword === "string" ? formEntries.confirmPassword : "",
        },
      };
    }

    // const fields: (keyof PasswordParams)[] = ["password"];
    // const passwordParams: PasswordParams = {
    //   email: email,
    //   firstName: firstname,
    //   lastName: lastname,
    //   organization: organization,
    //   requestId: requestId,
    // };

    // fields.forEach((field) => {
    //   const value = formData?.get(field);
    //   if (typeof value !== "string") {
    //     return {
    //       error: "Invalid Field",
    //     };
    //   }
    //   passwordParams[field] = value;
    // });

    // TODO - want to re-validate the account data first
    const response = await registerUser({
      email: email,
      firstName: firstname,
      lastName: lastname,
      password: formEntries.password as string,
      organization: organization,
      requestId: requestId,
    }).catch(() => {
      return {
        error: t("errors.couldNotRegisterUser"),
      };
    });

    if (response && "error" in response && response.error) {
      return {
        error: response.error,
      };
    }

    if (response && "redirect" in response && response.redirect) {
      router.push(response.redirect);
    }

    return formState;
  };

  // const [state, formAction] = useActionState(localFormAction, {});

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

  // const hasMinLength =
  //   passwordComplexitySettings && watchPassword?.length >= passwordComplexitySettings.minLength;
  // const hasSymbol = symbolValidator(watchPassword);
  // const hasNumber = numberValidator(watchPassword);
  // const hasUppercase = upperCaseValidator(watchPassword);
  // const hasLowercase = lowerCaseValidator(watchPassword);

  // const policyIsValid =
  //   passwordComplexitySettings &&
  //   (passwordComplexitySettings.requiresLowercase ? hasLowercase : true) &&
  //   (passwordComplexitySettings.requiresNumber ? hasNumber : true) &&
  //   (passwordComplexitySettings.requiresUppercase ? hasUppercase : true) &&
  //   (passwordComplexitySettings.requiresSymbol ? hasSymbol : true) &&
  //   hasMinLength;

  return (
    <>
      {state.error && <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>}
      <ErrorSummary id="errorSummary" validationErrors={state.validationErrors} />
      <form className="w-full" action={formAction} noValidate>
        <div className="mb-4 grid grid-cols-1 gap-4 pt-4">
          <div className="">
            <Label htmlFor="password" required>
              {t("create.labels.password")}
            </Label>
            {getError("password") && (
              <ErrorMessage id={"errorMessagePassword"}>{t(getError("password"))}</ErrorMessage>
            )}
            <TextInput
              id="password"
              className="w-full"
              type="password"
              required
              defaultValue={state.formData?.password ?? ""}
              onChange={(e) => setWatchPassword(e.target.value)}
            />
            <Hint>
              <div className="my-4">
                <I18n i18nKey="create.passwordHint" namespace="registerPassword" />
              </div>
              {passwordComplexitySettings && (
                <PasswordComplexity
                  passwordComplexitySettings={passwordComplexitySettings}
                  password={watchPassword}
                  equals={!!watchPassword && watchPassword === watchConfirmPassword}
                />
              )}
            </Hint>
          </div>
          <div className="">
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
              onChange={(e) => setWatchConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 flex w-full flex-row items-center justify-between">
          <BackButton data-testid="back-button" />
          {/* <SubmitButtonAction disabled={!policyIsValid || watchPassword !== watchConfirmPassword}>
            {t("submit")}
          </SubmitButtonAction> */}
          <SubmitButtonAction>{t("submit")}</SubmitButtonAction>
        </div>
      </form>
    </>
  );
}
