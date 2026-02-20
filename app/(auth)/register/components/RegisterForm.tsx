"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n";
import { useRegistration } from "../context/RegistrationContext";

import { Label, TextInput } from "@components/ui/form";
import { SubmitButtonAction } from "@components/ui/button/SubmitButton";
import { validateAccount } from "@lib/validationSchemas";
import { ErrorMessage } from "@components/ui/form/ErrorMessage";
import Link from "next/link";
import { Hint } from "@components/ui/form/Hint";
import { ErrorSummary } from "@components/ui/form/ErrorSummary";
import { buildUrlWithRequestId } from "@lib/utils";

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
  organization: string;
  requestId?: string;
};

const FORMS_PRODUCTION_URL = process.env.NEXT_PUBLIC_FORMS_PRODUCTION_URL || "";

export function RegisterForm({ organization, requestId }: Props) {
  const { t, i18n } = useTranslation(["register", "validation", "errorSummary", "common"]);
  const { setRegistrationData } = useRegistration();
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

    // Store registration data in context (persisted to sessionStorage)
    setRegistrationData({
      ...validationResult.output,
      ...(organization && { organization }),
      ...(requestId && { requestId }),
    });
    router.push(buildUrlWithRequestId("/register/password", requestId));

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
              defaultValue={state.formData?.firstname ?? ""}
              ariaDescribedbyIds={getError("firstname") ? ["errorMessageFirstname"] : undefined}
            />
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
              defaultValue={state.formData?.lastname ?? ""}
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
              defaultValue={state.formData?.email ?? ""}
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
