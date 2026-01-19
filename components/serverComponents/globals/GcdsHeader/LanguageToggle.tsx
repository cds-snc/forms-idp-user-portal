const toggledLang = (language: string) => {
  return language === "en" ? "fr" : "en";
};

export const LanguageToggle = ({
  pathname = "",
  language,
}: {
  pathname: string;
  language: string;
}) => {
  const lang = {
    en: { text: "English", abbr: "en", link: pathname.replace(`/${language}`, `/en`) },
    fr: { text: "Français", abbr: "fr", link: pathname.replace(`/${language}`, `/fr`) },
  };

  const displayLang = lang[toggledLang(language)];

  return (
    <div className="brand__toggle">
      <div className="gcds-lang-toggle">
        <h2 id="lang-toggle__heading" className="sr-only">
          {"lang-toggle"}
        </h2>
        <a id="lang-toggle-link" href={displayLang.link} lang={displayLang.abbr}>
          <span>{displayLang.text}</span>
          <abbr title={displayLang.text}>{displayLang.abbr}</abbr>
        </a>
      </div>
    </div>
  );
};
