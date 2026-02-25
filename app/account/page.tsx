/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getSessionCredentials } from "@lib/cookies";
import { logMessage } from "@lib/logger";
import { AuthLevel, checkAuthenticationLevel } from "@lib/server/route-protection";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { isSessionValid, loadMostRecentSession, loadSessionById } from "@lib/session";
import { getTOTPStatus, getU2FList, getUserByID } from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { MFAAuthentication } from "./components/MFAAuthentication";
import { PasswordAuthentication } from "./components/PasswordAuthentication";
import { PersonalDetails } from "./components/PersonalDetails";
import { VerifiedAccount } from "./components/VerifiedAccount";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("account");
  return { title: t("title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // Attempt to get session credentials from cookies
  let sessionId, organization, loginName;
  try {
    ({ sessionId, organization, loginName } = await getSessionCredentials());
  } catch (error) {
    redirect("/");
  }

  // Page-level authentication check - defense in depth
  const authCheck = await checkAuthenticationLevel(
    serviceUrl,
    AuthLevel.ANY_MFA_REQUIRED,
    loginName,
    organization
  );

  if (!authCheck.satisfied) {
    redirect(authCheck.redirect || "/");
  }

  const session = await loadSessionById(serviceUrl, sessionId, organization);
  const userId = session.factors?.user?.id;
  const userResponse = await getUserByID({ serviceUrl, userId: userId! });
  const user = userResponse.user?.type.case === "human" ? userResponse.user?.type.value : undefined;
  const firstName = user?.profile?.givenName;
  const lastName = user?.profile?.familyName;
  const email = user?.email?.email;

  if (!firstName || !lastName || !email || !userId || !session.factors?.password) {
    logMessage.info("Missing required user information or password factor, redirecting to login");
    redirect("/");
  }

  try {
    const authSession = await loadMostRecentSession({
      serviceUrl,
      sessionParams: { loginName, organization },
    });

    if (!authSession || !(await isSessionValid({ serviceUrl, session: authSession }))) {
      redirect("/");
    }
  } catch (error) {
    logMessage.error(
      `Error validating session, redirecting to login. Errors: ${JSON.stringify(error)}`
    );
    redirect("/");
  }

  const [u2fList, authenticatorStatus] = await Promise.all([
    getU2FList({
      serviceUrl,
      userId: userId!,
    }),
    getTOTPStatus({
      serviceUrl,
      userId: userId!,
    }),
  ]);

  return (
    <div id="content">
      <PersonalDetails userId={userId} firstName={firstName} lastName={lastName} />
      <div className="mb-4"></div>
      <VerifiedAccount email={email} />
      <div className="mb-4"></div>
      <PasswordAuthentication />
      <div className="mb-4"></div>
      <MFAAuthentication
        u2fList={u2fList}
        authenticatorStatus={authenticatorStatus}
        userId={userId}
      />
    </div>
  );
}
