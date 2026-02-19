import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getPasswordComplexitySettings } from "@lib/zitadel";
import { getSessionCredentials } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { checkAuthenticationLevel, AuthLevel } from "@lib/server/route-protection";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { ChangePasswordForm } from "./components/ChangePasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("change.title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { sessionId, loginName, organization } = await getSessionCredentials();

  // Page-level authentication check - defense in depth
  const authCheck = await checkAuthenticationLevel(
    serviceUrl,
    AuthLevel.PASSWORD_REQUIRED,
    loginName,
    organization
  );

  if (!authCheck.satisfied) {
    redirect(authCheck.redirect || "/password");
  }

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization,
  });

  if (!loginName || !sessionId || !organization || !passwordComplexitySettings) {
    throw new Error("No session.");
  }

  return (
    <AuthPanel
      titleI18nKey="change.title"
      descriptionI18nKey="change.description"
      namespace="password"
    >
      <ChangePasswordForm
        sessionId={sessionId}
        loginName={loginName}
        organization={organization}
        passwordComplexitySettings={passwordComplexitySettings}
      />
    </AuthPanel>
  );
}
