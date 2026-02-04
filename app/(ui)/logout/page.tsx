import { SessionsClearList } from "./components/sessions-clear-list";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getDefaultOrg } from "@lib/zitadel";
import { loadSessionsFromCookies } from "@lib/server/session";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("logout");
  return { title: t("title") };
}

async function loadSessions({ serviceUrl }: { serviceUrl: string }) {
  return loadSessionsFromCookies({ serviceUrl });
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const organization = searchParams?.organization;
  const postLogoutRedirectUri =
    searchParams?.post_logout_redirect || searchParams?.post_logout_redirect_uri;
  const logoutHint = searchParams?.logout_hint;
  // TODO implement with new translation service
  // const UILocales = searchParams?.ui_locales;

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

  const sessions = await loadSessions({ serviceUrl });

  const params = new URLSearchParams();

  if (organization) {
    params.append("organization", organization);
  }

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="description" namespace="logout">
      <div className="w-full">
        <div className="flex w-full flex-col space-y-2">
          <SessionsClearList
            sessions={sessions}
            logoutHint={logoutHint}
            postLogoutRedirectUri={postLogoutRedirectUri}
            organization={organization ?? defaultOrganization}
          />
        </div>
      </div>
    </AuthPanel>
  );
}
