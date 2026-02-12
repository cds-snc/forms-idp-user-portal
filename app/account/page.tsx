import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.title") };
}

export default async function Page() {
  return <div>Account</div>;
}
