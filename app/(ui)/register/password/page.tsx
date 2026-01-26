import { SetRegisterPasswordForm } from "./components/set-register-password-form";
import { I18n } from "@i18n";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSerializableObject } from "@lib/utils";
import {
  getDefaultOrg,
  getLegalAndSupportSettings,
  getLoginSettings,
  getPasswordComplexitySettings,
} from "@lib/zitadel";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { headers } from "next/headers";

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  let { firstname, lastname, email, organization, requestId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  if (!organization) {
    const org: Organization | null = await getDefaultOrg({
      serviceUrl,
    });
    if (org) {
      organization = org.id;
    }
  }

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
          <p className="ztdl-p">
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
          <p className="ztdl-p">
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
