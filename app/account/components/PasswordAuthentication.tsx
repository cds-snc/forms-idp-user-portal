"use client";
import { useTranslation } from "react-i18next";

import { LinkButton } from "@components/Buttons/LinkButton";

export const PasswordAuthentication = () => {
  const { t } = useTranslation("account");

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="mb-6">{t("authentication.title")}</h3>
          <div>
            <LinkButton.Primary href="/password/change">
              {t("authentication.change")}
            </LinkButton.Primary>
          </div>
        </div>
        <div>
          <div className="mb-1 font-semibold">{t("authentication.password")}</div>
          {/* Placeholder password characters used instead of real password for security reasons */}
          <div>
            &#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;
          </div>
        </div>
      </div>
    </>
  );
};
