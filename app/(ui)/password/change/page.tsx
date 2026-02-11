import { Alert } from "@clientComponents/globals";
import { ChangePasswordForm } from "./components/change-password-form";

import { I18n } from "@i18n";
// import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadAndValidateSession } from "@lib/session";
import { getPasswordComplexitySettings } from "@lib/zitadel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("change.title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { session, loginName, organization, requestId } = await loadAndValidateSession(
    serviceUrl
  ).catch(() => redirect("/start"));

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization: session?.factors?.user?.organizationId,
  });

  // const loginSettings = await getLoginSettings({
  //   serviceUrl,
  //   organization: session?.factors?.user?.organizationId,
  // });

  return (
    <>
      <AuthPanel
        titleI18nKey="change.title"
        descriptionI18nKey="change.description"
        namespace="password"
      >
        {/* show error only if usernames should be shown to be unknown */}
        {/* {(!session || !loginName) && !loginSettings?.ignoreUnknownUsernames && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          </div>
        )} */}

        {/* {sessionFactors && (
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
          ></UserAvatar>
        )} */}

        {passwordComplexitySettings && loginName && session?.factors?.user?.id ? (
          <ChangePasswordForm
            sessionId={session.id}
            loginName={loginName}
            requestId={requestId}
            organization={organization}
            passwordComplexitySettings={passwordComplexitySettings}
          />
        ) : (
          <div className="py-4">
            <Alert.Warning>
              <I18n i18nKey="failedLoading" namespace="error" />
            </Alert.Warning>
          </div>
        )}
      </AuthPanel>
    </>
  );
}
