import { RegisterU2f } from "./components/register-u2f";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
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

  if (!sessionFactors) {
    throw new Error("No session factors found");
  }

  if (!loginName || !sessionFactors.id) {
    throw new Error("No loginName or sessionId provided");
  }

  return (
    <AuthPanel
      titleI18nKey="set.title"
      descriptionI18nKey="none"
      namespace="u2f"
      imageSrc="/img/key-icon.png"
    >
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

      <div className="w-full">
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
    </AuthPanel>
  );
}
