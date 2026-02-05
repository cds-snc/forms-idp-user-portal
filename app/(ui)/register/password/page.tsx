import { SetRegisterPasswordForm } from "./components/set-register-password-form";
import { serverTranslation } from "@i18n/server";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { validateAccount } from "@lib/validationSchemas";
import {
  getDefaultOrg,
  getLegalAndSupportSettings,
  getPasswordComplexitySettings,
} from "@lib/zitadel";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
