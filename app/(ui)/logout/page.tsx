import { SessionsClearList } from "./components/sessions-clear-list";
import { I18n } from "@i18n";
import { getAllSessionCookieIds } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getDefaultOrg, listSessions } from "@lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("logout");
  return { title: t("title") };
}

async function loadSessions({ serviceUrl }: { serviceUrl: string }) {
  const cookieIds = await getAllSessionCookieIds();

  if (cookieIds && cookieIds.length) {
    const response = await listSessions({
      serviceUrl,
      ids: cookieIds.filter((id) => !!id) as string[],
    });
    return response?.sessions ?? [];
  } else {
    console.info("No session cookie found.");
    return [];
  }
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

  let sessions = await loadSessions({ serviceUrl });

  const params = new URLSearchParams();

  if (organization) {
    params.append("organization", organization);
  }

  return (
    <>
      <div id="auth-panel">
        <AuthPanelTitle i18nKey="title" namespace="logout" />

        <I18n i18nKey="description" namespace="logout" tagName="p" className="mb-6" />

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
      </div>
    </>
  );
}
