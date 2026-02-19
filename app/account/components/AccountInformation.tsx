"use client";
import { useActionState, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, toast, ToastContainer } from "@components/clientComponents/globals";
import { updateAccountAction } from "../actions";
import { Label, TextInput } from "@components/clientComponents/forms";
import { SubmitButtonAction } from "@components/clientComponents/globals/Buttons";
import { validateAccount } from "@lib/validationSchemas";
import { ErrorMessage } from "@components/clientComponents/forms/ErrorMessage";

type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
};

export const AccountInformation = ({
  userId,
  firstName,
  lastName,
  email,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}) => {
  const { t } = useTranslation("account");
  const [editMode, setEditMode] = useState(false);

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
          fieldValue: t(`accountDetails.validation.${issue.message}`),
        })),
        formData: formEntries,
      };
    }

    // updating will only change the email and not the username but will trigger
    // email validation on the newly added email
    const result = await updateAccountAction({
      userId,
      firstName: formEntries.firstname,
      lastName: formEntries.lastname,
      email: formEntries.email,
    });

    if ("error" in result) {
      toast.error(result.error || t("accountDetails.errors.updateFailed"), "account-details");
      return {
        formData: formEntries,
      };
    }

    setEditMode(false);
    toast.success(t("accountDetails.success.updateSuccess"), "account-details");

    return previousState;
  };

  const [state, formAction] = useActionState(localFormAction, {
    validationErrors: undefined,
    formData: {
      firstname: firstName || "",
      lastname: lastName || "",
      email: email || "",
    },
  });

  const getError = (fieldKey: string) => {
    return state.validationErrors?.find((e) => e.fieldKey === fieldKey)?.fieldValue || "";
  };

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="mb-6">{t("accountDetails.title")}</h3>
          <div>
            <Button theme="primary" onClick={() => setEditMode(!editMode)}>
              {editMode ? t("accountDetails.cancel") : t("accountDetails.change")}
            </Button>
          </div>
        </div>
        {!editMode && (
          <div>
            <ul className="list-none p-0">
              <li className="mb-4">
                <div className="mb-1 font-semibold">{t("accountDetails.firstName")}</div>
                <div>
                  <em>{firstName}</em>
                </div>
              </li>
              <li className="mb-4">
                <div className="mb-1 font-semibold">{t("accountDetails.lastName")}</div>
                <div>
                  <em>{lastName}</em>
                </div>
              </li>
              <li className="mb-4">
                <div className="mb-1 font-semibold">{t("accountDetails.email")}</div>
                <div>
                  <em>{email}</em>
                </div>
              </li>
            </ul>
          </div>
        )}
        {editMode && (
          <form action={formAction} noValidate>
            <div className="mb-4 flex flex-col gap-4">
              <div className="gcds-input-wrapper">
                <Label className="required" htmlFor="firstname" required>
                  {t("accountDetails.firstName")}
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
                  {t("accountDetails.lastName")}
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
                  {t("accountDetails.email")}
                </Label>
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

            <div>
              <SubmitButtonAction>{t("accountDetails.updateAccount")}</SubmitButtonAction>
            </div>
          </form>
        )}
      </div>
      <ToastContainer autoClose={false} containerId="account-details" />
    </>
  );
};
