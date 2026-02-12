"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n/client";
import Image from "next/image";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { getImageUrl } from "@lib/imageUrl";
import { Button } from "@clientComponents/globals/Buttons";
import { ENABLE_EMAIL_OTP } from "@root/constants/config";

import { cn } from "@lib/utils";

type Props = {
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  userMethods: AuthenticationMethodType[];
};

export function ChooseSecondFactor({ userMethods }: Props) {
  const router = useRouter();
  const { t } = useTranslation("mfa");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string>("");

  const authMehods = userMethods.filter((method) => {
    if (!ENABLE_EMAIL_OTP && method === AuthenticationMethodType.OTP_EMAIL) {
      return false;
    }

    if (method === AuthenticationMethodType.PASSWORD) {
      return false;
    }
    return true;
  });

  const handleMethodSelect = (method: string, url: string) => {
    setSelectedMethod(method);
    setNextUrl(url);
  };

  const handleContinue = () => {
    if (nextUrl) {
      router.push(nextUrl);
    }
  };

  const renderOption = (
    method: string,
    title: string,
    icon: string,
    description: string,
    url: string
  ) => (
    <div
      className={cn(
        "cursor-pointer rounded-md border-2 p-6 transition-all",
        selectedMethod === method
          ? "border-gcds-blue-vivid bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      )}
      onClick={() => handleMethodSelect(method, url)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleMethodSelect(method, url);
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Image src={getImageUrl(icon)} alt={title} width={32} height={32} className="mt-1" />
          <div>
            <div className="font-bold">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        </div>
        {selectedMethod === method && (
          <Image src={getImageUrl("/img/check_24px.png")} alt="Selected" width={24} height={24} />
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={cn("grid w-full grid-cols-1  pt-4", authMehods.length >= 2 && "gap-5")}>
        {authMehods.map((method, i) => {
          return (
            <div key={"method-" + i}>
              {method === AuthenticationMethodType.TOTP &&
                renderOption(
                  "authenticator",
                  t("set.authenticator.title"),
                  "/img/verified_user_24px.png",
                  t("set.authenticator.description"),
                  "/otp/time-based"
                )}
              {method === AuthenticationMethodType.U2F &&
                renderOption(
                  "securityKey",
                  t("set.securityKey.title"),
                  "/img/fingerprint_24px.png",
                  t("set.securityKey.description"),
                  "/u2f"
                )}
              {method === AuthenticationMethodType.OTP_EMAIL &&
                renderOption(
                  "email",
                  t("set.email.title"),
                  "/img/email_24px.png",
                  t("set.email.description"),
                  "/otp/email"
                )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-start">
        <Button theme="primary" disabled={!selectedMethod} onClick={handleContinue}>
          {t("set.continue") || "Continue"}
        </Button>
      </div>
    </>
  );
}
