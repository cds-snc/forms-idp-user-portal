"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n/client";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { Button } from "@clientComponents/globals/Buttons";
import { ENABLE_EMAIL_OTP } from "@root/constants/config";
import { MethodOptionCard } from "./MethodOptionCard";

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

  return (
    <>
      <div className={cn("grid w-full grid-cols-1  pt-4", authMehods.length >= 2 && "gap-5")}>
        {authMehods.map((method, i) => {
          return (
            <div key={"method-" + i}>
              {method === AuthenticationMethodType.TOTP && (
                <MethodOptionCard
                  method="authenticator"
                  title={t("set.authenticator.title")}
                  icon="/img/verified_user_24px.png"
                  description={t("set.authenticator.description")}
                  url="/otp/time-based"
                  isSelected={selectedMethod === "authenticator"}
                  onSelect={handleMethodSelect}
                />
              )}
              {method === AuthenticationMethodType.U2F && (
                <MethodOptionCard
                  method="securityKey"
                  title={t("set.securityKey.title")}
                  icon="/img/fingerprint_24px.png"
                  description={t("set.securityKey.description")}
                  url="/u2f"
                  isSelected={selectedMethod === "securityKey"}
                  onSelect={handleMethodSelect}
                />
              )}
              {method === AuthenticationMethodType.OTP_EMAIL && (
                <MethodOptionCard
                  method="email"
                  title={t("set.email.title")}
                  icon="/img/email_24px.png"
                  description={t("set.email.description")}
                  url="/otp/email"
                  isSelected={selectedMethod === "email"}
                  onSelect={handleMethodSelect}
                />
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
