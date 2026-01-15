"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert, Label, TextInput, ErrorStatus } from "@clientComponents/forms";
import { useTranslation } from "@i18n/client";
import { sendLoginname } from "@lib/server/username";
import { useRouter } from "next/navigation";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";
import { Button } from "@clientComponents/globals";

type Props = {
  loginName: string | undefined;
  requestId: string | undefined;

  organization?: string;
  suffix?: string;
  submit: boolean;
  allowRegister: boolean;
};

type FormState = {
  formData: {
    username: string;
  };
  error?: string;
};

export const UserNameForm = ({
  loginName,
  requestId,
  organization,
  suffix,
  submit,
  allowRegister,
}: Props) => {
  const { t } = useTranslation(["start", "common"]);

  useEffect(() => {
    if (submit && loginName) {
      // When we navigate to this page, we always want to be redirected if submit is true and the parameters are valid.
      localFormAction({ formData: { username: loginName } });
    }
  }, []);
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

  const [state, formAction] = useActionState(localFormAction, {
    formData: {
      username: loginName ? loginName : "",
    },
  });

  return (
    <div className="w-2/3">
      {state.error && (
        <Alert type={ErrorStatus.ERROR} heading={state.error} focussable={true} id="cognitoErrors">
          {state.error}
        </Alert>
      )}

      <form id="login" action={formAction} noValidate>
        <div className="mb-4">
          <Label id={"label-username"} htmlFor={"username"} className="required" required>
            {t("form.label")}
          </Label>
          <div className="mb-4 text-sm text-black" id="login-description">
            {t("form.description")}
          </div>
          <TextInput
            className="h-10 w-full max-w-lg rounded-xl"
            type={"email"}
            id={"username"}
            name={"username"}
            required
            defaultValue={state.formData?.username || ""}
          />
        </div>

        {allowRegister && (
          <Button
            onClick={() => {
              const registerParams = new URLSearchParams();
              if (organization) {
                registerParams.append("organization", organization);
              }
              if (requestId) {
                registerParams.append("requestId", requestId);
              }

              router.push("/register?" + registerParams);
            }}
            type="button"
            disabled={loading}
            data-testid="register-button"
          >
            {t("register")}
          </Button>
        )}
        <SubmitButtonAction className="float-right">{t("button.continue")}</SubmitButtonAction>
      </form>
    </div>
  );
};
