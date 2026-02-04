import { I18n } from "@i18n";

import { SearchParams } from "@lib/utils";

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
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
