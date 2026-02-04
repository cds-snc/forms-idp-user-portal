import { Alert } from "@clientComponents/globals";

import { RegisterU2f } from "./components/register-u2f";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getLoginSettings } from "@lib/zitadel";
import { getSerializableObject } from "@lib/utils";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("u2f");
  return { title: t("set.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const { loginName, organization, requestId, checkAfter } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization,
  }).then((obj) => getSerializableObject(obj));

  const sessionFactors = await loadMostRecentSession({
    serviceUrl,
    sessionParams: {
      loginName,
      organization,
    },
  });

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <h1>
          <I18n i18nKey="set.title" namespace="u2f" />
        </h1>

        <p className="ztdl-p mb-6 block">
          <I18n i18nKey="set.description" namespace="u2f" />
        </p>

        {sessionFactors && (
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        )}
      </div>

      <div className="w-full">
        {!sessionFactors && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          </div>
        )}

        {sessionFactors?.id && (
          <RegisterU2f
            loginName={loginName}
            sessionId={sessionFactors.id}
            organization={organization}
            requestId={requestId}
            checkAfter={checkAfter === "true"}
            loginSettings={loginSettings}
          />
        )}
      </div>
    </>
  );
}
