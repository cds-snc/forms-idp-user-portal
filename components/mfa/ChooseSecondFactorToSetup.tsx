"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n/client";

import { ENABLE_EMAIL_OTP } from "@root/constants/config";
import { MethodOptionCard } from "./MethodOptionCard";

import { Button } from "@clientComponents/globals/Buttons";

type Props = {
  checkAfter: boolean;
  force?: boolean;
};

export function ChooseSecondFactorToSetup({ checkAfter }: Props) {
  const router = useRouter();
  const { t } = useTranslation("mfa");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string>("");

  const params = new URLSearchParams({});

  if (checkAfter) {
    params.append("checkAfter", "true");
  }

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
      <div className="grid w-full grid-cols-1 gap-5 pt-4">
        {/* Email - OTP_EMAIL (Default) */}
        {ENABLE_EMAIL_OTP && (
          <MethodOptionCard
            method="email"
            title={t("set.email.title")}
            icon="/img/email_24px.png"
            description={t("set.email.description")}
            url={"/otp/email/set?" + params}
            isSelected={selectedMethod === "email"}
            isDefault={true}
            defaultText={t("set.byDefault")}
            onSelect={handleMethodSelect}
          />
        )}

        {/* Authentication App - TOTP */}
        <MethodOptionCard
          method="authenticator"
          title={t("set.authenticator.title")}
          icon="/img/verified_user_24px.png"
          description={t("set.authenticator.description")}
          url={"/otp/time-based/set?" + params}
          isSelected={selectedMethod === "authenticator"}
          onSelect={handleMethodSelect}
        />

        {/* Security Key - U2F */}
        <MethodOptionCard
          method="securityKey"
          title={t("set.securityKey.title")}
          icon="/img/fingerprint_24px.png"
          description={t("set.securityKey.description")}
          url={"/u2f/set?" + params}
          isSelected={selectedMethod === "securityKey"}
          onSelect={handleMethodSelect}
        />
      </div>

      <div className="mt-8 flex justify-start">
        <Button theme="primary" disabled={!selectedMethod} onClick={handleContinue}>
          {t("set.continue") || "Continue"}
        </Button>
      </div>
    </>
  );
}
