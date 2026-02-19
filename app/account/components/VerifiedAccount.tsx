"use client";
import { Trans, useTranslation } from "react-i18next";

import Link from "next/link";

const FORMS_PRODUCTION_URL = process.env.NEXT_PUBLIC_FORMS_PRODUCTION_URL || "";

export const VerifiedAccount = ({ email }: { email: string }) => {
  const {
    t,
    i18n: { language },
  } = useTranslation("account");

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="mb-6">{t("verifiedAccount.title")}</h3>
          <p className="max-w-48">
            <Trans
              i18nKey="verifiedAccount.changeMessage"
              ns="account"
              components={[
                <strong key="0" />,
                <Link key="1" href="/register" />,
                <Link key="2" href={`${FORMS_PRODUCTION_URL}/${language}/support`} />,
              ]}
            />
          </p>
        </div>

        <div className="mb-1 font-semibold">{t("verifiedAccount.email")}</div>
        <div>
          <em>{email}</em>
        </div>
      </div>
    </>
  );
};
