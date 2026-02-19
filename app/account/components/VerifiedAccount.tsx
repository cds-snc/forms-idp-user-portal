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
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div>
            <h3 className="mb-6">{t("verifiedAccount.title")}</h3>
            <div className="mb-1 font-semibold">{t("verifiedAccount.email")}</div>
            <div>
              <em>{email}</em>
            </div>
          </div>
          <p className="max-w-48 self-start text-right">
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
      </div>
    </>
  );
};
