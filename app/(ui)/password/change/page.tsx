import { Alert } from "@clientComponents/globals";
import { ChangePasswordForm } from "./components/change-password-form";

import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getBrandingSettings, getLoginSettings, getPasswordComplexitySettings } from "@lib/zitadel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("change.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const searchParams = await props.searchParams;

  const { loginName, organization, requestId } = searchParams;

  // also allow no session to be found (ignoreUnkownUsername)
  const sessionFactors = await loadMostRecentSession({
    serviceUrl,
    sessionParams: {
      loginName,
      organization,
    },
  });

  const branding = await getBrandingSettings({
    serviceUrl,
    organization,
  });

  const passwordComplexity = await getPasswordComplexitySettings({
    serviceUrl,
    organization: sessionFactors?.factors?.user?.organizationId,
  });

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: sessionFactors?.factors?.user?.organizationId,
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1>
          <I18n i18nKey="change.title" namespace="password" />
        </h1>
        <p className="ztdl-p mb-6 block">
          <I18n i18nKey="change.description" namespace="password" />
        </p>

        {/* show error only if usernames should be shown to be unknown */}
        {(!sessionFactors || !loginName) && !loginSettings?.ignoreUnknownUsernames && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          </div>
        )}

        {sessionFactors && (
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
          ></UserAvatar>
        )}
      </div>

      <div className="w-full">
        {passwordComplexity && loginName && sessionFactors?.factors?.user?.id ? (
          <ChangePasswordForm
            sessionId={sessionFactors.id}
            loginName={loginName}
            requestId={requestId}
            organization={organization}
            passwordComplexitySettings={passwordComplexity}
          />
        ) : (
          <div className="py-4">
            <Alert.Warning>
              <I18n i18nKey="failedLoading" namespace="error" />
            </Alert.Warning>
          </div>
        )}
      </div>
    </>
  );
}
