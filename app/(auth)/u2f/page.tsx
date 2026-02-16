import { headers } from "next/headers";
import { Metadata } from "next";

/*--------------------------------------------*
 * Methods
 *--------------------------------------------*/
import { getSessionCredentials } from "@lib/cookies";
import { getSafeRedirectUrl } from "@lib/redirect-validator";
import { SearchParams } from "@lib/utils";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById } from "@lib/session";
import { serverTranslation } from "@i18n/server";

/*--------------------------------------------*
 * Components
 *--------------------------------------------*/
import { LoginU2F } from "@components/mfa/u2f/LoginU2F";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("u2f");
  return { title: t("verify.title") };
}

// Hardware key login page
export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const { redirect } = searchParams;
  const { sessionId, loginName, organization, requestId } = await getSessionCredentials();
  const safeRedirect = getSafeRedirectUrl(redirect);

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
            organization={organization}
            requestId={requestId}
            login={false} // this sets the userVerificationRequirement to discouraged as its used as second factor
            redirect={safeRedirect}
          />
        )}
      </div>
    </AuthPanel>
  );
}
