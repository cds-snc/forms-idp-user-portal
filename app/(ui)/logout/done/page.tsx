import { AuthPanel } from "@serverComponents/globals/AuthPanel";

export default async function Page() {
  return (
    <>
      <AuthPanel
        titleI18nKey="success.title"
        namespace="logout"
        descriptionI18nKey="success.description"
      />
    </>
  );
}
