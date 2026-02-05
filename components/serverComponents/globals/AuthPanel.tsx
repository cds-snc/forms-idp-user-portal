import { ReactNode } from "react";
import { AuthPanelTitle } from "./AuthPanelTitle";
import { I18n } from "@i18n";

interface AuthPanelProps {
  titleI18nKey: string;
  descriptionI18nKey: string;
  namespace: string;
  titleData?: Record<string, string | undefined>;
  children?: ReactNode;
}

export const AuthPanel = ({
  titleI18nKey,
  descriptionI18nKey,
  namespace,
  titleData,
  children,
}: AuthPanelProps) => {
  return (
    <div id="auth-panel">
      {titleI18nKey !== "none" && (
        <AuthPanelTitle i18nKey={titleI18nKey} namespace={namespace} data={titleData} />
      )}
      {descriptionI18nKey !== "none" && (
        <I18n i18nKey={descriptionI18nKey} namespace={namespace} tagName="p" className="mb-6" />
      )}
      {children}
    </div>
  );
};
