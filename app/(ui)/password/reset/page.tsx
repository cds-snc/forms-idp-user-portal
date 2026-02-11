import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getPasswordComplexitySettings } from "@lib/zitadel";
import { loadAndValidateSession } from "@lib/session";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { PasswordReset } from "./components/PasswordReset";
import { redirect } from "next/navigation";

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

  const { userId, loginName, organization, requestId } = await loadAndValidateSession(
    serviceUrl
  ).catch(() => redirect("/start"));

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization,
  });

  return (
    <AuthPanel
      titleI18nKey="reset.title"
      descriptionI18nKey="reset.description"
      namespace="password"
    >
      <PasswordReset
        userId={userId}
        passwordComplexitySettings={passwordComplexitySettings}
        code={code}
        organization={organization}
        requestId={requestId}
        loginName={loginName}
      />
    </AuthPanel>
  );
}
