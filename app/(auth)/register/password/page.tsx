import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverTranslation } from "@i18n/server";

import { getSessionCredentials } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { validateAccount } from "@lib/validationSchemas";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { SetRegisterPasswordForm } from "./components/SetRegisterPasswordForm";
import { getLegalAndSupportSettings, getPasswordComplexitySettings } from "@lib/zitadel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("create.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const searchParams = await props.searchParams;
  const { firstname, lastname, email, requestId } = searchParams;

  const { organization } = await getSessionCredentials();

  const missingData = !firstname || !lastname || !email || !organization;
  const validateData = await validateAccount({ firstname, lastname, email } as {
    [k: string]: FormDataEntryValue;
  });

  const legal = await getLegalAndSupportSettings({
    serviceUrl,
    organization,
  });

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization,
  });

  if (missingData || !validateData.success) {
    redirect(`/register/`);
  }

  return (
    <AuthPanel
      titleI18nKey="password.title"
      descriptionI18nKey="password.description"
      namespace="register"
    >
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
    </AuthPanel>
  );
}
