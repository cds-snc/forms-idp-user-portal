import { LoginU2F } from "./components/login-u2f";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { SearchParams } from "@lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("u2f");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;

  const { loginName, requestId, sessionId, organization } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionData = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  // Extract just the session factors from the session data
  const sessionFactors = sessionData ? { factors: sessionData.factors } : undefined;

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
          searchParams={searchParams}
        ></UserAvatar>
      )}
      <div className="w-full">
        {(loginName || sessionId) && (
          <LoginU2F
            loginName={loginName}
            sessionId={sessionId}
            requestId={requestId}
            altPassword={false}
            organization={organization}
            login={false} // this sets the userVerificationRequirement to discouraged as its used as second factor
          />
        )}
      </div>
    </AuthPanel>
  );
}
