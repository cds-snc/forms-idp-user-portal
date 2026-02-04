import { Alert, ErrorStatus } from "@clientComponents/forms/Alert";
import { getSerializableObject } from "@lib/utils";
import { PasswordForm } from "./components/PasswordForm";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getDefaultOrg, getLoginSettings } from "@lib/zitadel";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("verify.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { loginName, organization, requestId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({
      serviceUrl,
    });

    if (org) {
      defaultOrganization = org.id;
    }
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

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? defaultOrganization,
  }).then((obj) => getSerializableObject(obj));

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="verify.description" namespace="password">
      {sessionFactors && (
        <div className="mb-6">
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        </div>
      )}

      <div>
        {/* show error only if usernames should be shown to be unknown */}
        {(!sessionFactors || !loginName) && !loginSettings?.ignoreUnknownUsernames && (
          <div className="py-4">
            <Alert type={ErrorStatus.ERROR}>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert>
          </div>
        )}

        {loginName && (
          <PasswordForm
            loginName={loginName}
            requestId={requestId}
            organization={organization} // stick to "organization" as we still want to do user discovery based on the searchParams not the default organization, later the organization is determined by the found user
            loginSettings={loginSettings}
          />
        )}
      </div>
    </AuthPanel>
  );
}
