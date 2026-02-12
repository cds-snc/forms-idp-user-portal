import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getPasswordComplexitySettings } from "@lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSessionCredentials } from "@lib/cookies";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { PasswordReset } from "./components/PasswordReset";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("reset.title") };
}

export default async function Page() {
  const { loginName, organization } = await getSessionCredentials();
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // also allow no session to be found (ignoreUnkownUsername)
  let session: Session | undefined;
  if (loginName) {
    session = await loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    });
  }

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization: session?.factors?.user?.organizationId,
  });

  // ??
  if (!loginName || !session?.id || !organization) {
    throw new Error("No session.");
  }

  return (
    <AuthPanel
      titleI18nKey="reset.title"
      descriptionI18nKey="reset.description"
      namespace="password"
    >
      <PasswordReset
        userId={session.factors?.user?.id}
        passwordComplexitySettings={passwordComplexitySettings}
        organization={organization}
        loginName={loginName}
      />
    </AuthPanel>
  );
}
