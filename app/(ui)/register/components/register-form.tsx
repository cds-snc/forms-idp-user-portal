"use client";
import { useActionState } from "react";

import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";

import { useTranslation } from "@i18n";
import * as v from "valibot";

import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorListItem, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { emailSchema, firstnameSchema, lastnameSchema } from "@lib/validationSchemas";
// import { ErrorCharacterCount } from "@clientComponents/forms/ErrorCharacterCount";
import { ErrorMessage } from "@clientComponents/forms/ErrorMessage";
import Link from "next/link";
import { Hint } from "@clientComponents/forms/Hint";

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

const validateAccount = async (formEntries: { [k: string]: FormDataEntryValue }) => {
  const formValidationSchema = v.pipe(
    v.object({
      ...firstnameSchema(),
      ...lastnameSchema(),
      ...emailSchema(),
    })
  );
  return v.safeParse(formValidationSchema, formEntries, { abortPipeEarly: true });
};

// TODO Language detection

export function RegisterForm({ email, firstname, lastname, organization, requestId }: Props) {
  const { t, i18n } = useTranslation(["register", "validation", "errorSummary"]);

  const router = useRouter();

  const localFormAction = async (previousState: FormState, formData: FormData) => {
    const originalFormData = {
      firstname: formData.get("firstname") as string,
      lastname: formData.get("lastname") as string,
      email: formData.get("email") as string,
    };

    const rawFormData = Object.fromEntries(formData.entries());

    const validationResult = await validateAccount(rawFormData);

    if (!validationResult.success) {
      return {
        validationErrors: validationResult.issues.map((issue) => ({
          fieldKey: issue.path?.[0].key as string,
          fieldValue: t(issue.message || "required", { ns: "validation" }),
        })),
        formData: originalFormData,
      };
    }

    const registerParams: RegisterData = {
      ...validationResult.output,
      ...(organization && { organization }),
      ...(requestId && { requestId }),
    };
    router.push(`/register/password?` + new URLSearchParams(registerParams));

    // Case of router throwing an error or something, fallback to original state
    // This is unnecessary since Next would route to a HTTP status error page?
    return {
      validationErrors: undefined,
      formData: originalFormData,
    };
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

  // TODO WIP add validation on typing/blur or similar?

  return (
    <>
      {state.validationErrors && Object.keys(state.validationErrors).length > 0 && (
        // TODO move to ErrroSummary commponent pass in something like an array
        <Alert
          className="w-full"
          type={ErrorStatus.ERROR}
          validation={true}
          tabIndex={0}
          focussable={true}
          id="registrationValidationErrors"
          heading={t("title", { ns: "errorSummary" })}
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

        {/* TODO terms page or link to app? */}
        <p className="-mt-2 mb-10">
          {t("terms.agreement")}
          <Link href={`/${i18n.language}/terms-of-use`}>{t("terms.linkText")}</Link>
        </p>

        <div className="mt-8 flex flex-row items-center justify-between">
          <BackButton data-testid="back-button" />
          <SubmitButtonAction>{t("submit")}</SubmitButtonAction>
        </div>
      </form>
    </>
  );
}
