"use client";
import { useActionState } from "react";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n";

import { Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { validateAccount } from "@lib/validationSchemas";
// import { ErrorCharacterCount } from "@clientComponents/forms/ErrorCharacterCount";
import { ErrorMessage } from "@clientComponents/forms/ErrorMessage";
import Link from "next/link";
import { Hint } from "@clientComponents/forms/Hint";
import { ErrorSummary } from "@clientComponents/forms/ErrorSummary";

type RegisterData = {
  firstname?: string;
  lastname?: string;
  email?: string;
  organization?: string;
  requestId?: string;
};

type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
};

type Props = {
  firstname?: string;
  lastname?: string;
  email?: string;
  organization: string;
  requestId?: string;
  loginSettings?: LoginSettings;
  idpCount: number;
};

const FORMS_PRODUCTION_URL = process.env.NEXT_PUBLIC_FORMS_PRODUCTION_URL || "";

export function RegisterForm({ email, firstname, lastname, organization, requestId }: Props) {
  const { t, i18n } = useTranslation(["register", "validation", "errorSummary", "common"]);

  const router = useRouter();

  const localFormAction = async (previousState: FormState, formData: FormData) => {
    const formEntries = {
      firstname: (formData.get("firstname") as string) || "",
      lastname: (formData.get("lastname") as string) || "",
      email: (formData.get("email") as string) || "",
    };

    // Validate form entries and map any errors to form state with translated messages
    const formEntriesData = Object.fromEntries(formData.entries());
    const validationResult = await validateAccount(formEntriesData);
    if (!validationResult.success) {
      return {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: t(`validation.${issue.message}`),
        })),
        formData: formEntries,
      };
    }

    const registerParams: RegisterData = {
      ...validationResult.output,
      ...(organization && { organization }),
      ...(requestId && { requestId }),
    };
    router.push(`/register/password?` + new URLSearchParams(registerParams));

    return previousState;
  };

  const [state, formAction] = useActionState(localFormAction, {
    validationErrors: undefined,
    formData: {
      firstname: "",
      lastname: "",
      email: "",
    },
  });

  const getError = (fieldKey: string) => {
    return state.validationErrors?.find((e) => e.fieldKey === fieldKey)?.fieldValue || "";
  };

  return (
    <>
      <ErrorSummary id="errorSummary" validationErrors={state.validationErrors} />
      <form action={formAction} noValidate>
        <div className="mb-4 flex flex-col gap-4">
          <div className="gcds-input-wrapper">
            <Label className="required" htmlFor="firstname" required>
              {t("labels.firstname")}
            </Label>
            {getError("firstname") && (
              <ErrorMessage id={"errorMessageFirstname"}>{getError("firstname")}</ErrorMessage>
            )}
            <TextInput
              className="w-full"
              type="text"
              id="firstname"
              autoComplete="given-name"
              required
              defaultValue={state.formData?.firstname ?? firstname ?? ""}
              ariaDescribedbyIds={getError("firstname") ? ["errorMessageFirstname"] : undefined}
            />
            {/* TODO? <ErrorCharacterCount id="characterCountMessageFirstname" maxLength={50} /> */}
          </div>
          <div className="gcds-input-wrapper">
            <Label htmlFor="lastname" required>
              {t("labels.lastname")}
            </Label>
            {getError("lastname") && (
              <ErrorMessage id={"errorMessageLastname"}>{getError("lastname")}</ErrorMessage>
            )}
            <TextInput
              className="w-full"
              type="text"
              autoComplete="family-name"
              required
              id="lastname"
              defaultValue={state.formData?.lastname ?? lastname ?? ""}
              ariaDescribedbyIds={getError("lastname") ? ["errorMessageLastname"] : undefined}
            />
          </div>
          <div className="gcds-input-wrapper col-span-2">
            <Label htmlFor="email" required>
              {t("labels.email")}
            </Label>
            <Hint>{t("emailInputHint")}</Hint>
            {getError("email") && (
              <ErrorMessage id={"errorMessageEmail"}>{getError("email")}</ErrorMessage>
            )}
            <TextInput
              className="w-full"
              type="email"
              autoComplete="email"
              required
              id="email"
              defaultValue={state.formData?.email ?? email ?? ""}
              ariaDescribedbyIds={getError("email") ? ["errorMessageEmail"] : undefined}
            />
          </div>
        </div>

        <p className="-mt-2 mb-10">
          {t("terms.agreement")}
          <Link href={`${FORMS_PRODUCTION_URL}/${i18n.language}/terms-of-use`}>
            {t("terms.linkText")}
          </Link>
        </p>

        <div>
          <SubmitButtonAction>{t("button.continue", { ns: "common" })}</SubmitButtonAction>
        </div>
      </form>
    </>
  );
}
