import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("common");
  return { title: t("account.title", "Account") };
}

export default async function Page() {
  return <div></div>;
}
