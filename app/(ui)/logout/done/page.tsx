import { I18n } from "@i18n";

export default async function Page(props: { searchParams: Promise<any> }) {
  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1>
          <I18n i18nKey="success.title" namespace="logout" />
        </h1>
        <p className="ztdl-p mb-6 block">
          <I18n i18nKey="success.description" namespace="logout" />
        </p>
      </div>
      <div className="w-full"></div>
    </>
  );
}
