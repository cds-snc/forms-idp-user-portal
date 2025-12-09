"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n";

const LanguageToggle = () => {
  const {
    t,
    i18n: { language: currentLang, changeLanguage },
  } = useTranslation("header");

  const router = useRouter();

  return (
    <div className="gc-lang-toggle-link text-right text-base">
      <h2 className="sr-only" lang={currentLang}>
        {t("lang-toggle")}
      </h2>
      <a
        className="text-right text-base"
        lang={currentLang === "en" ? "fr" : "en"}
        onClick={() => {
          changeLanguage(currentLang === "en" ? "fr" : "en");
          router.refresh();
        }}
      >
        {currentLang === "en" ? "Français" : "English"}
      </a>
    </div>
  );
};

export default LanguageToggle;
