/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { cookies } from "next/headers";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { LANGUAGE_COOKIE_NAME } from "./client";
import { languages } from "./settings";

const normalizeLocaleToSupportedLanguage = (locale: string) => {
  if (languages.includes(locale)) {
    return locale;
  }

  const baseLocale = locale.split("-")[0]?.toLowerCase();

  if (baseLocale && languages.includes(baseLocale)) {
    return baseLocale;
  }

  return languages[0];
};

export async function getCurrentLanguage() {
  const cookieLang = (await cookies()).get(LANGUAGE_COOKIE_NAME)?.value;
  if (!cookieLang) {
    return languages[0];
  }

  return normalizeLocaleToSupportedLanguage(cookieLang);
}
