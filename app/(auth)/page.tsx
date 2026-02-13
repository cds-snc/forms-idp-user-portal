import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getLoginSettings } from "@lib/zitadel";
import { Metadata } from "next";
import { I18n } from "@i18n";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { UserNameForm } from "../components/UserNameForm";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import Link from "next/dist/client/link";
import { getMostRecentSessionCookie, getSessionCredentials } from "@lib/cookies";
import { AvatarList, AvatarListItem } from "@serverComponents/globals/AvatarList";
import { isSessionValid, loadMostRecentSession } from "@lib/session";
import { ZITADEL_ORGANIZATION } from "@root/constants/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("start");
  return { title: t("title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const organization = ZITADEL_ORGANIZATION;

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization,
  });

  const registerLink = "/register";

  let currentSession;
  try {
    currentSession = await getMostRecentSessionCookie();
  } catch {
    currentSession = null;
  }

  let isAuthenticated = false;
  let session;

  try {
    const { loginName } = await getSessionCredentials();

    session = await loadMostRecentSession({
      serviceUrl,
      sessionParams: { loginName, organization },
    });

    isAuthenticated = session ? await isSessionValid({ serviceUrl, session }) : false;
  } catch (error) {
    session = null;
  }

  const accounts: AvatarListItem[] = [
    {
      loginName: currentSession?.loginName || "",
      organization: organization || currentSession?.organization || "",
      requestId: "",
      suffix: "",
      link: isAuthenticated ? "/account" : "/password",
      showDropdown: false,
    },
    {
      loginName: "Other account",
      organization: "",
      requestId: "outer-account-id",
      suffix: "",
      link: `/logout-session?returnUrl=/`,
      showDropdown: false,
    },
  ];

  if (currentSession) {
    return (
      <AuthPanel titleI18nKey="title" descriptionI18nKey="none" namespace="start">
        <AvatarList avatars={accounts} />

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

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="none" namespace="start">
      {!!loginSettings?.allowRegister && (
        <div className="mb-6">
          <I18n i18nKey="signUpText" namespace="start" />
          &nbsp;
          <Link href={registerLink}>
            <I18n i18nKey="signUpLink" namespace="start" />
          </Link>
        </div>
      )}

      <UserNameForm organization={organization} />
    </AuthPanel>
  );
}
