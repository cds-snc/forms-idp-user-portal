import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getPasswordComplexitySettings, listUsers } from "@lib/zitadel";
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

// TODO probably move to util (similar patter in user password registration )
const getUserId = async ({
  userId,
  loginName,
  organization,
  session,
  serviceUrl,
}: {
  userId?: string;
  loginName?: string;
  organization: string;
  session: Session;
  serviceUrl: string;
}) => {
  let resolvedUserId = userId;
  if (!resolvedUserId && loginName) {
    // Try from session
    resolvedUserId = session?.factors?.user?.id;

    // Fallback lookup by loginName
    if (!resolvedUserId) {
      const users = await listUsers({
        serviceUrl,
        loginName,
        organizationId: organization,
      });

      if (users.details?.totalResult && BigInt(1) && users.result[0]?.userId) {
        resolvedUserId = users.result[0].userId;
      }
    }

    return resolvedUserId;
  }
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { userId, loginName, organization, requestId, code } = await searchParams;

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

  const resolvedUserId = await getUserId({
    userId,
    loginName,
    organization: organization ?? session?.factors?.user?.organizationId ?? "",
    session: session as Session,
    serviceUrl,
  });

  return (
    <AuthPanel
      titleI18nKey="password.title"
      descriptionI18nKey="password.description"
      namespace="reset"
    >
      <PasswordReset
        userId={resolvedUserId}
        passwordComplexitySettings={passwordComplexitySettings}
        code={code}
        organization={organization}
        requestId={requestId}
        loginName={loginName}
      />
    </AuthPanel>
  );
}
