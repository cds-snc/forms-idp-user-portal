"use client";
import { useActionState } from "react";

import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";

import { useTranslation } from "@i18n";

import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";

type RegisterData = {
  firstname?: string;
  lastname?: string;
  email?: string;
  organization?: string;
  requestId?: string;
};

type FormState = {
  error?: string;
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

export function RegisterForm({ email, firstname, lastname, organization, requestId }: Props) {
  const { t } = useTranslation("register");

  const router = useRouter();

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    const fields: (keyof RegisterData)[] = ["firstname", "lastname", "email"];
    const registerParams: RegisterData = {};

    fields.forEach((field) => {
      const value = formData?.get(field);
      if (typeof value !== "string") {
        return {
          error: "Invalid Field",
        };
      }
      registerParams[field] = value;
    });

    if (organization) {
      registerParams.organization = organization;
    }

    if (requestId) {
      registerParams.requestId = requestId;
    }

    router.push(`/register/password?` + new URLSearchParams(registerParams));

    return previousState;
  };

  const [state, formAction] = useActionState(localFormAction, {});

  return (
    <form className="w-2/3" action={formAction}>
      <div className="mb-4 flex flex-col gap-4">
        <div>
          <Label htmlFor="firstname">{t("labels.firstname")}</Label>
          <TextInput
            className="w-full"
            type="text"
            id="firstname"
            autoComplete="firstname"
            required
            defaultValue={firstname}
          />
        </div>
        <div className="">
          <Label htmlFor="lastname">{t("labels.lastname")}</Label>
          <TextInput
            className="w-full"
            type="text"
            autoComplete="lastname"
            required
            id="lastname"
            defaultValue={lastname}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="email">{t("labels.email")}</Label>
          <TextInput
            className="w-full"
            type="email"
            autoComplete="email"
            required
            id="email"
            defaultValue={email}
          />
        </div>
      </div>

      {state.error && (
        <div className="py-4">
          <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>
        </div>
      )}

      <div className="mt-8 flex flex-row items-center justify-between">
        <BackButton data-testid="back-button" />
        <SubmitButtonAction>{t("submit")}</SubmitButtonAction>
      </div>
    </form>
  );
}
