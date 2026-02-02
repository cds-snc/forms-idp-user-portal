import { SessionsList } from "./components/sessions-list";
import { I18n } from "@i18n";
import { getAllSessionCookieIds } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getDefaultOrg, listSessions } from "@lib/zitadel";

import { AddIcon } from "@serverComponents/icons";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";

import { serverTranslation } from "@i18n/server";

import { headers } from "next/headers";
import Link from "next/link";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("accounts");
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
    return [];
  }
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;

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

  if (requestId) {
    params.append("requestId", requestId);
  }

  if (organization) {
    params.append("organization", organization);
  } else if (defaultOrganization) {
    params.append("organization", defaultOrganization);
  }

  return (
    <>
      <div id="auth-panel">
        <AuthPanelTitle i18nKey="title" namespace="accounts" />
        <I18n i18nKey="description" namespace="accounts" tagName="p" className="mb-6" />

        <div className="w-full">
          <div className="flex w-full flex-col space-y-2">
            <SessionsList sessions={sessions} requestId={requestId} />
            <Link href={`/start?` + params}>
              <div className="flex flex-row items-center rounded-md px-4 py-3 transition-all hover:bg-black/10">
                <div className="mr-2 flex size-8 flex-row items-center justify-center rounded-full">
                  <AddIcon className="size-5" />
                </div>
                <I18n i18nKey="addAnother" namespace="accounts" className="text-sm" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
