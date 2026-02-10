import { PasswordForm } from "./components/PasswordForm";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getSerializableLoginSettings } from "@lib/zitadel";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSessionCredentials } from "@lib/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("verify.title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { loginName, organization } = await getSessionCredentials();

  if (!loginName) {
    throw new Error("No login name found in session");
  }

  // also allow no session to be found (ignoreUnkownUsername)
  let sessionFactors;
  try {
    sessionFactors = await loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error);
  }

  const loginSettings = await getSerializableLoginSettings({
    serviceUrl,
    organizationId: organization,
  });

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="none" namespace="password">
      {sessionFactors && (
        <div className="mb-6">
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
          ></UserAvatar>
        </div>
      )}

      <div>
        <PasswordForm
          loginName={loginName}
          organization={organization} // stick to "organization" as we still want to do user discovery based on the searchParams not the default organization, later the organization is determined by the found user
          loginSettings={loginSettings}
        />
      </div>
    </AuthPanel>
  );
}
