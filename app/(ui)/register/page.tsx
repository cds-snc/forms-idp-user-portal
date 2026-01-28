import { Alert } from "@clientComponents/globals";

import { RegisterForm } from "./components/register-form";
import { I18n } from "@i18n";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import {
  getActiveIdentityProviders,
  getDefaultOrg,
  getLegalAndSupportSettings,
  getLoginSettings,
  getPasswordComplexitySettings,
} from "@lib/zitadel";
// import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
// import { PasskeysType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { Metadata } from "next";

import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSerializableObject } from "@lib/utils";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

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

  if (!loginSettings?.allowRegister) {
    return (
      <>
        <div className="flex flex-col space-y-4">
          <h1>
            <I18n i18nKey="disabled.title" namespace="register" />
          </h1>
          <p>
            <I18n i18nKey="disabled.description" namespace="register" />
          </p>
        </div>
        <div className="w-full"></div>
      </>
    );
  }

  return (
    <>
      <div id="auth-panel">
        <AuthPanelTitle i18nKey="title" namespace="register" />

        <div className="w-full">
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
        </div>
      </div>
    </>
  );
}
