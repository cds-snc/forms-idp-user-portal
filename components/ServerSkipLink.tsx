import { I18n } from "@i18n";

export const SkipLink = async () => {
  return (
    <div id="skip-link-container">
      <a href="#content" id="skip-link">
        <I18n i18nKey="skip-link" namespace="layout" />
      </a>
    </div>
  );
};
