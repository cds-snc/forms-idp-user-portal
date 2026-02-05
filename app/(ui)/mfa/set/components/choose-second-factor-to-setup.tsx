"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n/client";
import Image from "next/image";
import { getImageUrl } from "@lib/imageUrl";
import { Button } from "@clientComponents/globals/Buttons";

type Props = {
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  checkAfter: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  force?: boolean;
};

export function ChooseSecondFactorToSetup({
  loginName,
  sessionId,
  requestId,
  organization,
  checkAfter,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation("mfa");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string>("");

  const params = new URLSearchParams({});

  if (loginName) {
    params.append("loginName", loginName);
  }
  if (sessionId) {
    params.append("sessionId", sessionId);
  }
  if (requestId) {
    params.append("requestId", requestId);
  }
  if (organization) {
    params.append("organization", organization);
  }
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

  const renderOption = (
    method: string,
    title: string,
    isDefault: boolean,
    icon: string,
    description: string,
    url: string
  ) => (
    <div
      className={`cursor-pointer rounded-md border-2 p-6 transition-all ${
        selectedMethod === method
          ? "border-gcds-blue-vivid bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
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
            <div className="font-bold">
              {title}
              {isDefault && (
                <>
                  {" "}
                  — <span className="italic">{t("set.byDefault")}</span>
                </>
              )}
            </div>
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
      <div className="grid w-full grid-cols-1 gap-5 pt-4">
        {/* Email - OTP_EMAIL (Default) */}
        {renderOption(
          "email",
          t("set.email.title"),
          true,
          "/img/email_24px.png",
          t("set.email.description"),
          "/otp/email/set?" + params
        )}

        {/* Authentication App - TOTP */}
        {renderOption(
          "authenticator",
          t("set.authenticator.title"),
          false,
          "/img/verified_user_24px.png",
          t("set.authenticator.description"),
          "/otp/time-based/set?" + params
        )}

        {/* Security Key - U2F */}
        {renderOption(
          "securityKey",
          t("set.securityKey.title"),
          false,
          "/img/fingerprint_24px.png",
          t("set.securityKey.description"),
          "/u2f/set?" + params
        )}
      </div>

      <div className="mt-8 flex justify-start">
        <Button theme="primary" disabled={!selectedMethod} onClick={handleContinue}>
          {t("set.continue") || "Continue"}
        </Button>
      </div>
    </>
  );
}
