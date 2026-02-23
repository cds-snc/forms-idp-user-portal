/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { ZITADEL_ORGANIZATION } from "@root/constants/config";
import { getSessionCredentials } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { isSessionValid, loadMostRecentSession } from "@lib/session";
import { buildUrlWithRequestId, SearchParams } from "@lib/utils";
import { I18n } from "@i18n";
import { serverTranslation } from "@i18n/server";
import { AuthPanel } from "@components/auth/AuthPanel";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { LoginForm } from "./components/LoginForm";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("start");
  return { title: t("title") };
}

export default async function LoginPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const requestId = searchParams.requestId;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const organization = ZITADEL_ORGANIZATION;

  // Check if user is already authenticated
  try {
    const { loginName } = await getSessionCredentials();

    const session = await loadMostRecentSession({
      serviceUrl,
      sessionParams: { loginName, organization },
    });

    const isAuthenticated = session ? await isSessionValid({ serviceUrl, session }) : false;

    if (isAuthenticated) {
      // User is already logged in, redirect to account page
      redirect(buildUrlWithRequestId("/account", requestId));
    }
  } catch (error) {
    // No valid session, continue to login form
  }

  const registerLink = buildUrlWithRequestId("/register", requestId);

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="form.description" namespace="start">
      <LoginForm requestId={requestId} organization={organization} />

      <p className="mt-10">
        <I18n i18nKey="register" namespace="start" />
        &nbsp;
        <Link href={registerLink}>
          <I18n i18nKey="registerLinkText" namespace="start" />
        </Link>
        .
      </p>
    </AuthPanel>
  );
}
