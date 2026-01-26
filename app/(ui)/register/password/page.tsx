import { SetRegisterPasswordForm } from "./components/set-register-password-form";
import { I18n } from "@i18n";
import { serverTranslation } from "@i18n/server";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSerializableObject } from "@lib/utils";
import {
  getDefaultOrg,
  getLegalAndSupportSettings,
  getLoginSettings,
  getPasswordComplexitySettings,
} from "@lib/zitadel";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";
import { Metadata } from "next";
// import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("create.title") };
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

  const missingData = !firstname || !lastname || !email || !organization;

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

  if (missingData) {
    return (
      <>
        <div className="flex flex-col space-y-4">
          <AuthPanelTitle i18nKey="missingdata.title" namespace="registerPassword" />
          <p>
            <I18n i18nKey="missingdata.description" namespace="registerPassword" />
          </p>
        </div>
      </>
    );
  }

  // TODO Should this be done on the register page also/instead?
  if (!loginSettings?.allowRegister || !loginSettings.allowUsernamePassword) {
    return (
      <>
        <div className="flex flex-col space-y-4">
          <AuthPanelTitle i18nKey="disabled.title" namespace="registerPassword" />
          <p>
            <I18n i18nKey="disabled.description" namespace="registerPassword" />
          </p>
        </div>
      </>
    );
  }

  return (
    <div id="auth-panel">
      <AuthPanelTitle i18nKey="title" namespace="registerPassword" />
      {legal && passwordComplexitySettings && (
        <SetRegisterPasswordForm
          passwordComplexitySettings={passwordComplexitySettings}
          email={email}
          firstname={firstname}
          lastname={lastname}
          organization={organization as string} // organization is guaranteed to be a string here otherwise we would have returned earlier
          requestId={requestId}
        ></SetRegisterPasswordForm>
      )}
    </div>
  );
}
