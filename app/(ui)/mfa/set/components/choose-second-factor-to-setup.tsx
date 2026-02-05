"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n/client";
import Image from "next/image";
import { getImageUrl } from "@lib/imageUrl";

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

  const handleFactorClick = (url: string) => {
    router.push(url);
  };

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-5 pt-4">
        {/* Security Key - U2F */}
        <div
          className="cursor-pointer rounded-md border-2 border-gray-300 p-6 hover:border-gray-400"
          onClick={() => handleFactorClick("/u2f/set?" + params)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleFactorClick("/u2f/set?" + params);
            }
          }}
        >
          <div className="flex items-start gap-4">
            <Image
              src={getImageUrl("/img/fingerprint_24px.png")}
              alt={t("set.securityKey.title")}
              width={32}
              height={32}
              className="mt-1"
            />
            <div>
              <div className="font-bold">
                {t("set.securityKey.title")} —{" "}
                <span className="italic">{t("set.securityKey.recommended")}</span>
              </div>
              <div className="text-sm text-gray-600">{t("set.securityKey.description")}</div>
            </div>
          </div>
        </div>

        {/* Authentication App - TOTP */}
        <div
          className="cursor-pointer rounded-md border-2 border-gray-300 p-6 hover:border-gray-400"
          onClick={() => handleFactorClick("/otp/time-based/set?" + params)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleFactorClick("/otp/time-based/set?" + params);
            }
          }}
        >
          <div className="flex items-start gap-4">
            <Image
              src={getImageUrl("/img/verified_user_24px.png")}
              alt={t("set.authenticator.title")}
              width={32}
              height={32}
              className="mt-1"
            />
            <div>
              <div className="font-bold">{t("set.authenticator.title")}</div>
              <div className="text-sm text-gray-600">{t("set.authenticator.description")}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
