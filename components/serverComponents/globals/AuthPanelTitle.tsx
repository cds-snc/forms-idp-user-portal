import { I18n } from "@i18n";

export const AuthPanelTitle = ({ i18nKey, namespace }: { i18nKey: string; namespace: string }) => {
  return (
    <div className="mb-6 mt-4">
      <h1 className="!mb-0">
        <I18n i18nKey={i18nKey} namespace={namespace} />
      </h1>
    </div>
  );
};
