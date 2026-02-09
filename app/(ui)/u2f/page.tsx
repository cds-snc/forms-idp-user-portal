import { LoginU2F } from "./components/login-u2f";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById } from "@lib/session";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSessionCredentials } from "@lib/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("u2f");
  return { title: t("verify.title") };
}

export default async function Page() {
  const { sessionId, loginName, organization } = await getSessionCredentials();

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);

  if (!sessionFactors) {
    throw new Error("No session factors found");
  }

  if (!loginName || !sessionFactors.factors?.user?.id) {
    throw new Error("No loginName or sessionId provided");
  }

  return (
    <AuthPanel
      titleI18nKey="verify.title"
      descriptionI18nKey="none"
      namespace="u2f"
      imageSrc="/img/key-icon.png"
    >
      {sessionFactors && (
        <UserAvatar
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          displayName={sessionFactors.factors?.user?.displayName}
          showDropdown
        ></UserAvatar>
      )}
      <div className="w-full">
        {(loginName || sessionId) && (
          <LoginU2F
            loginName={loginName}
            sessionId={sessionId}
            altPassword={false}
            organization={organization}
            login={false} // this sets the userVerificationRequirement to discouraged as its used as second factor
          />
        )}
      </div>
    </AuthPanel>
  );
}
