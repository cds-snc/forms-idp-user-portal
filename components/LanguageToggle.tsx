"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n";

const toggledLang = (language: string) => {
  return language === "en" ? "fr" : "en";
};

const LanguageToggle = () => {
  const {
    t,
    i18n: { language: currentLang, changeLanguage },
  } = useTranslation("header");

  const lang = {
    en: { text: "English", abbr: "en" },
    fr: { text: "Français", abbr: "fr" },
  };

  const displayLang = lang[toggledLang(currentLang)];

  const router = useRouter();

  return (
    <div className="gcds-lang-toggle inline-block">
      <h2 className="sr-only" lang={currentLang}>
        {t("lang-toggle")}
      </h2>
      <a
        id="lang-toggle-link"
        className="gcds-lang-toggle"
        lang={displayLang.abbr}
        onClick={() => {
          changeLanguage(currentLang === "en" ? "fr" : "en");
          router.refresh();
        }}
      >
        <span>{displayLang.text}</span>
        <abbr title={displayLang.text}>{displayLang.abbr}</abbr>
      </a>
    </div>
  );
};

export default LanguageToggle;
