"use client";
import { useTranslation } from "react-i18next";

import { Button } from "@components/clientComponents/globals";
import { updateAccountAction } from "../actions";

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

  const updateAccount = async () => {
    const timestamp = new Date().toISOString(); // TODO temp - next add form inputs
    const result = await updateAccountAction({
      userId,
      firstName: firstName + timestamp,
      lastName: lastName + timestamp,
      email: email, // updating will not change the username but will trigger email validation
    });
    if ("error" in result) {
      console.error("Failed to update account:", result.error);
      return;
    }
    console.log("Account updated successfully");
  };

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="mb-6">{t("accountDetails.title")}</h3>
          <div>
            <Button theme="primary" onClick={updateAccount}>
              {t("accountDetails.change")}
            </Button>
          </div>
        </div>
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
      </div>
    </>
  );
};
