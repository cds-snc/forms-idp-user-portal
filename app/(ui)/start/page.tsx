import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getDefaultOrg, getLoginSettings } from "@lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { I18n } from "@i18n";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { UserNameForm } from "./components/UserNameForm";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";
import Link from "next/dist/client/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("start");
  return { title: t("title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const loginName = searchParams?.loginName;
  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;
  const suffix = searchParams?.suffix;
  const submit: boolean = searchParams?.submit === "true";

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
  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? defaultOrganization,
  });

  const registerParams = new URLSearchParams();
  if (organization) {
    registerParams.append("organization", organization);
  }
  if (requestId) {
    registerParams.append("requestId", requestId);
  }

  const registerLink = `/register?${registerParams.toString()}`;

  return (
    <div id="auth-panel">
      <AuthPanelTitle i18nKey="title" namespace="start" />

      {!!loginSettings?.allowRegister && (
        <div className="mb-6">
          <I18n i18nKey="x" namespace="start" />
          &nbsp;
          <Link href={registerLink}>
            <I18n i18nKey="signUpLink" namespace="start" />
          </Link>
        </div>
      )}

      <UserNameForm
        loginName={loginName}
        requestId={requestId}
        organization={organization}
        suffix={suffix}
        submit={submit}
      />
    </div>
  );
}
