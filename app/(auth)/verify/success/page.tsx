import Image from "next/image";
import { headers } from "next/headers";
import { SearchParams, buildUrlWithRequestId } from "@lib/utils";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { LinkButton } from "@serverComponents/globals/Buttons/LinkButton";
import { I18n } from "@i18n";
import { getImageUrl } from "@lib/imageUrl";

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { requestId } = searchParams;

  return (
    <AuthPanel
      titleI18nKey="successTitle"
      descriptionI18nKey="successDescription"
      namespace="verify"
    >
      <div className="mt-6">
        <Image
          src={getImageUrl("/img/goose_flying.png")}
          alt="Success"
          width={704 / 2}
          height={522 / 2}
          className="mx-auto mb-4"
        />

        <LinkButton.Primary href={buildUrlWithRequestId("/mfa/set", requestId)} className="mt-10">
          <I18n i18nKey="continueButton" namespace="verify" />
        </LinkButton.Primary>
      </div>
    </AuthPanel>
  );
}
