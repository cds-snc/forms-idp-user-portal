import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

import { getPasswordComplexitySettings } from "@lib/zitadel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById } from "@lib/session";
import { getSessionCredentials } from "@lib/cookies";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { PasswordReset } from "./components/PasswordReset";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("reset.title") };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const params = await searchParams;
  const code = params.code;

  const { sessionId, loginName, organization } = await getSessionCredentials();
  const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization,
  });

  if (!loginName || !sessionId || !organization) {
    throw new Error("No session.");
  }

  return (
    <AuthPanel
      titleI18nKey="reset.title"
      descriptionI18nKey="reset.description"
      namespace="password"
    >
      <PasswordReset
        userId={sessionFactors.factors?.user?.id}
        passwordComplexitySettings={passwordComplexitySettings}
        code={code}
        organization={organization}
        loginName={loginName}
      />
    </AuthPanel>
  );
}
