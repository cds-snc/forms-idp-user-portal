"use client";

import { setPreferredMFAMethod, getPreferredMFAMethodForUser } from "@lib/server/mfa-preferences";
import {
  LoginSettings,
  SecondFactorType,
} from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { useRouter } from "next/navigation";
import { EMAIL, TOTP, U2F } from "@serverComponents/AuthMethods/AuthMethods";
import { I18n } from "@i18n";
import { useState, useEffect } from "react";
import { Alert } from "@clientComponents/globals";
import { toast } from "@clientComponents/globals/Toast";

type Props = {
  userId: string;
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  loginSettings: LoginSettings;
  userMethods: AuthenticationMethodType[];
  checkAfter: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  force: boolean;
};

export function ChooseSecondFactorToSetup({
  userId,
  loginName,
  sessionId,
  requestId,
  organization,
  loginSettings,
  userMethods,
  checkAfter,
  emailVerified,
}: Props) {
  const router = useRouter();
  const params = new URLSearchParams({});

  const [error, setError] = useState<string>("");
  const [selectedDefault, setSelectedDefault] = useState<AuthenticationMethodType | null>(
    AuthenticationMethodType.OTP_EMAIL
  );

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const preference = await getPreferredMFAMethodForUser(userId);
        if (preference) {
          setSelectedDefault(preference);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load preferred MFA method:", err);
      }
    };

    loadPreference();
  }, [userId]);

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

  const handleSetAsDefault = async (method: AuthenticationMethodType, checked: boolean) => {
    if (checked) {
      setSelectedDefault(method);
      // Save immediately when checkbox is checked
      const result = await setPreferredMFAMethod(userId, method);
      if (!result.success) {
        setError(result.error || "Failed to set default MFA method");
        setSelectedDefault(null);
        return;
      }
      toast.success("Default MFA method saved");
    } else {
      setSelectedDefault(null);
      // Save immediately when checkbox is unchecked
      const result = await setPreferredMFAMethod(userId, AuthenticationMethodType.OTP_EMAIL);
      if (!result.success) {
        setError(result.error || "Failed to reset default MFA method");
        setSelectedDefault(method);
        return;
      }
      toast.success("Default MFA method reset to Email");
    }
  };

  const handleFactorClick = async (method: AuthenticationMethodType, url: string) => {
    // Navigate to the setup page
    router.push(url);
  };

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-5 pt-4">
        {loginSettings.secondFactors.map((factor) => {
          let method: AuthenticationMethodType | null = null;
          let url: string = "";
          let component = null;

          switch (factor) {
            case SecondFactorType.OTP:
              method = AuthenticationMethodType.TOTP;
              url = "/otp/time-based/set?" + params;
              component = TOTP(userMethods.includes(AuthenticationMethodType.TOTP), "#");
              break;
            case SecondFactorType.U2F:
              method = AuthenticationMethodType.U2F;
              url = "/u2f/set?" + params;
              component = U2F(userMethods.includes(AuthenticationMethodType.U2F), "#");
              break;
            case SecondFactorType.OTP_EMAIL:
              if (emailVerified) {
                method = AuthenticationMethodType.OTP_EMAIL;
                url = "/otp/email/set?" + params;
                component = EMAIL(userMethods.includes(AuthenticationMethodType.OTP_EMAIL), "#");
              }
              break;
          }

          if (!method || !component) return null;

          return (
            <div key={`factor-${method}`}>
              <div
                className="cursor-pointer"
                onClick={() => handleFactorClick(method, url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleFactorClick(method, url);
                  }
                }}
              >
                {component}
              </div>
              <div className="mt-2 flex items-center gap-2 pl-4">
                <input
                  type="checkbox"
                  id={`default-${method}`}
                  checked={selectedDefault === method}
                  onChange={(e) => handleSetAsDefault(method, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer"
                />
                <label
                  htmlFor={`default-${method}`}
                  className="cursor-pointer text-sm text-gray-700"
                >
                  <I18n i18nKey="set.setAsDefaultShort" namespace="mfa" />
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <div className="py-4" data-testid="error">
          <Alert.Danger>{error}</Alert.Danger>
        </div>
      )}
    </>
  );
}
