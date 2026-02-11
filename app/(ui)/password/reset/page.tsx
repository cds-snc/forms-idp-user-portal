import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getPasswordComplexitySettings } from "@lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { PasswordReset } from "./components/PasswordReset";

// TODO:
// need to check that they have verified according to earlier factors screen
// - search for exampl with export async function isSessionValid({..
// - and shouldEnforceMFA(

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password.set");
  return { title: t("title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const searchParams = await props.searchParams;
  const { userId, loginName, organization, requestId, code, initial } = searchParams;

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

  return (
    <AuthPanel
      titleI18nKey="password.title"
      descriptionI18nKey="password.description"
      namespace="reset"
    >
      <PasswordReset
        userId={userId}
        passwordComplexitySettings={passwordComplexitySettings}
        code={code}
        organization={organization}
        requestId={requestId}
        // loginName={loginName}
      />
    </AuthPanel>
  );
}
