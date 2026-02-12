import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

import { getPasswordComplexitySettings } from "@lib/zitadel";
import { getSessionCredentials } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";

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
