"use client";
import { useTranslation } from "react-i18next";

import { LinkButton } from "@components/serverComponents/globals/Buttons/LinkButton";

export const AccountInformation = ({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) => {
  const { t } = useTranslation("account");

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="mb-6">{t("accountDetails.title")}</h3>
          <div>
            {/* TODO link to update page or change to form entry mode once decided */}
            <LinkButton.Primary href="/account">{t("accountDetails.change")}</LinkButton.Primary>
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
