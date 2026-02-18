"use client";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getImageUrl } from "@lib/imageUrl";

import { ToastContainer } from "@clientComponents/globals";
import { toast } from "@components/clientComponents/globals/Toast";
import { Button } from "@components/clientComponents/globals";
import { removeTOTPAction, removeU2FAction } from "../actions";

export const Authentication = ({
  u2fList,
  userId,
  authenticatorStatus,
}: {
  u2fList: Array<{ id: string; name: string; state?: string }>;
  userId: string;
  authenticatorStatus: boolean;
}) => {
  const { t } = useTranslation("account");
  const hasMFAMethods = (Array.isArray(u2fList) && u2fList.length > 0) || authenticatorStatus;

  const handleRemoveU2F = async (u2fId: string) => {
    const result = await removeU2FAction(userId, u2fId);
    if ("error" in result) {
      toast.error(
        result.error || t("authentication.errors.failedToRemoveSecurityKey"),
        "account-authentication"
      );
      return;
    }
    toast.success(t("authentication.success.keyRemoved"), "account-authentication");
  };

  const handleRemoveAuthenticator = async () => {
    const result = await removeTOTPAction(userId);
    if ("error" in result) {
      toast.error(
        result.error || t("authentication.errors.failedToRemoveAuthApp"),
        "account-authentication"
      );
      return;
    }
    toast.success(t("authentication.success.authAppRemoved"), "account-authentication");
  };

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <h3 className="mb-6">{t("authentication.title")}</h3>

        {!hasMFAMethods && <p>{t("authentication.noTwoFactor")}</p>}

        {hasMFAMethods && (
          <>
            <div>
              <ul className="list-none p-0">
                {u2fList.length > 0 &&
                  u2fList
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                    .map((data) => {
                      return (
                        <li key={data.id} className="mb-4">
                          <Image
                            src={getImageUrl("/img/fingerprint_24px.png")}
                            alt=""
                            width={32}
                            height={32}
                            className="mr-2 inline-block"
                          />
                          <span className="mr-2 font-semibold">
                            {t("authentication.securityKey")}
                          </span>
                          <span>({data.name || t("authentication.unknownDevice")})</span>
                          <span className="mx-2">&#8226;</span>
                          <Button onClick={() => handleRemoveU2F(data.id)} theme="link">
                            {t("authentication.remove")}
                          </Button>
                        </li>
                      );
                    })}

                {authenticatorStatus && (
                  <li className="mb-4">
                    <Image
                      src={getImageUrl("/img/verified_user_24px.png")}
                      alt=""
                      width={32}
                      height={32}
                      className="mr-2 inline-block"
                    />
                    <span className="mr-2 font-semibold">
                      {t("authentication.authenticatorApp")}
                    </span>
                    <span className="mx-2">&#8226;</span>
                    <Button onClick={handleRemoveAuthenticator} theme="link">
                      {t("authentication.remove")}
                    </Button>
                  </li>
                )}
              </ul>
            </div>
            <div className="mt-6 flex align-middle">
              <Image
                src={getImageUrl("/img/plus.svg")}
                alt=""
                width={24}
                height={24}
                className="mr-1"
              />{" "}
              <Link href="/mfa/set">{t("authentication.addlMethods")}</Link>
            </div>
          </>
        )}
      </div>
      <ToastContainer autoClose={false} containerId="account-authentication" />
    </>
  );
};
