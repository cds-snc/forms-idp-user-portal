import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/*--------------------------------------------*
 * Methods
 *--------------------------------------------*/
import { serverTranslation } from "@i18n/server";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById } from "@lib/session";
import { getSessionCredentials } from "@lib/cookies";
import { checkAuthenticationLevel, AuthLevel } from "@lib/server/route-protection";
import { logMessage } from "@lib/logger";

/*--------------------------------------------*
 * Components
 *--------------------------------------------*/
import { RegisterU2f } from "@components/mfa/u2f/RegisterU2f";
import { UserAvatar } from "@components/UserAvatar";
import { AuthPanel } from "@components/AuthPanel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("u2f");
  return { title: t("set.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { checkAfter } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { sessionId, loginName, organization, requestId } = await getSessionCredentials();

  const authCheck = await checkAuthenticationLevel(
    serviceUrl,
    AuthLevel.PASSWORD_REQUIRED,
    loginName,
    organization
  );

  if (!authCheck.satisfied) {
    logMessage.debug({
      message: "U2F setup page auth check failed",
      reason: authCheck.reason,
      redirect: authCheck.redirect,
    });
    redirect(authCheck.redirect || "/password");
  }

  const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);

  if (!sessionFactors) {
    logMessage.debug({
      message: "U2F setup page missing session factors",
      hasSessionId: !!sessionId,
      hasOrganization: !!organization,
    });
    redirect("/mfa/set");
  }

  if (!loginName || !sessionFactors.id) {
    logMessage.debug({
      message: "U2F setup page missing required user context",
      hasLoginName: !!loginName,
      hasSessionFactorId: !!sessionFactors.id,
    });
    redirect("/mfa/set");
  }

  return (
    <AuthPanel
      titleI18nKey="set.title"
      descriptionI18nKey="none"
      namespace="u2f"
      imageSrc="/img/key-icon.png"
    >
      <div className="mb-6">
        <UserAvatar
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          displayName={sessionFactors.factors?.user?.displayName}
          showDropdown={false}
        ></UserAvatar>
      </div>

      <RegisterU2f
        sessionId={sessionFactors.id}
        requestId={requestId}
        checkAfter={checkAfter === "true"}
      />
    </AuthPanel>
  );
}
