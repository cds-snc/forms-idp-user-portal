import { Alert } from "@clientComponents/globals";

import { RegisterForm } from "./components/RegisterForm";
import { I18n } from "@i18n";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import {
  getActiveIdentityProviders,
  getDefaultOrg,
  getLegalAndSupportSettings,
  getLoginSettings,
  getPasswordComplexitySettings,
} from "@lib/zitadel";

import { Metadata } from "next";

import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSerializableObject } from "@lib/utils";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("register");
  return { title: t("title") };
}

const getOrg = async (serviceUrl: string) => {
  const org = await getDefaultOrg({
    serviceUrl,
  });
  if (org) {
    return org.id;
  }
};

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const searchParams = await props.searchParams;
  const { firstname, lastname, email, requestId } = searchParams;
  const organization = searchParams.organization ?? (await getOrg(serviceUrl));

  const legal = await getLegalAndSupportSettings({
    serviceUrl,
    organization,
  });
  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization,
  });

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization,
  }).then((obj) => getSerializableObject(obj));

  const identityProviders = await getActiveIdentityProviders({
    serviceUrl,
    orgId: organization,
  }).then((resp) => {
    return resp.identityProviders.filter((idp) => {
      return idp.options?.isAutoCreation || idp.options?.isCreationAllowed; // check if IDP allows to create account automatically or manual creation is allowed
    });
  });

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="description" namespace="register">
      {!organization && (
        <Alert.Danger>
          <I18n i18nKey="unknownContext" namespace="error" />
        </Alert.Danger>
      )}

      {legal && passwordComplexitySettings && organization && (
        <RegisterForm
          idpCount={!loginSettings?.allowExternalIdp ? 0 : identityProviders.length}
          organization={organization}
          firstname={firstname}
          lastname={lastname}
          email={email}
          requestId={requestId}
          loginSettings={loginSettings}
        ></RegisterForm>
      )}
    </AuthPanel>
  );
}
