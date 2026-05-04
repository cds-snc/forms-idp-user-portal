/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";
import { redirect } from "next/navigation";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getSessionCredentials } from "@lib/cookies";
import { logMessage } from "@lib/logger";
import { getSafeRedirectUrl } from "@lib/redirect-validator";
import { AuthLevel, checkAuthenticationLevel } from "@lib/server/route-protection";
import { loadSessionById } from "@lib/session";
import { SearchParams } from "@lib/utils";
import { serverTranslation } from "@i18n/server";
import { UserAvatar } from "@components/account/user-avatar";
import { AuthPanel } from "@components/auth/AuthPanel";
import { LoginU2F } from "@components/mfa/LoginU2F";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("u2f");
  return { title: t("verify.title") };
}

// Hardware key login page
export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const { redirect: redirectParam } = searchParams;
  const { sessionId, loginName, requestId } = await getSessionCredentials();
  const safeRedirect = getSafeRedirectUrl(redirectParam);

  const authCheck = await checkAuthenticationLevel(AuthLevel.PASSWORD_REQUIRED, loginName);

  if (!authCheck.satisfied) {
    logMessage.debug({
      message: "U2F verify page auth check failed",
      reason: authCheck.reason,
      redirect: authCheck.redirect,
    });
    redirect(authCheck.redirect || "/password");
  }

  const sessionFactors = await loadSessionById(sessionId);

  if (!sessionFactors) {
    logMessage.debug({
      message: "U2F verify page missing session factors",
      hasSessionId: !!sessionId,
    });
    redirect("/mfa");
  }

  if (!loginName || !sessionFactors.factors?.user?.id) {
    logMessage.debug({
      message: "U2F verify page missing required user context",
      hasLoginName: !!loginName,
      hasUserId: !!sessionFactors.factors?.user?.id,
    });
    redirect("/mfa");
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
          showDropdown={false}
        ></UserAvatar>
      )}
      <div className="w-full">
        {(loginName || sessionId) && (
          <LoginU2F
            loginName={loginName}
            sessionId={sessionId}
            requestId={requestId}
            login={false} // this sets the userVerificationRequirement to discouraged as its used as second factor
            redirect={safeRedirect}
          />
        )}
      </div>
    </AuthPanel>
  );
}
