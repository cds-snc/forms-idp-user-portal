import { ReactNode } from "react";
import { AuthPanelTitle } from "./AuthPanelTitle";
import { I18n } from "@i18n";
import Image from "next/image";
import { getImageUrl } from "@lib/imageUrl";

interface AuthPanelProps {
  titleI18nKey: string;
  descriptionI18nKey: string;
  namespace: string;
  beforeTitle?: ReactNode;
  titleData?: Record<string, string | undefined>;
  children?: ReactNode;
  imageSrc?: string;
}

export const AuthPanel = ({
  titleI18nKey,
  descriptionI18nKey,
  namespace,
  titleData,
  children,
  imageSrc,
}: AuthPanelProps) => {
  return (
    <div id="auth-panel">
      {imageSrc && (
        <div className="mb-6 flex justify-center">
          <Image src={getImageUrl(imageSrc)} alt="" width={125} height={96} />
        </div>
      )}

      {titleI18nKey !== "none" && (
        <AuthPanelTitle
          i18nKey={titleI18nKey}
          namespace={namespace}
          data={titleData}
          className={imageSrc ? "text-center" : ""}
        />
      )}
      {descriptionI18nKey !== "none" && (
        <I18n i18nKey={descriptionI18nKey} namespace={namespace} tagName="p" className="mb-6" />
      )}
      {children}
    </div>
  );
};
