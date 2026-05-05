/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { logMessage } from "@lib/logger";
import { loadSessionsFromCookies } from "@lib/server/session";
import { isSessionValid } from "@lib/session";
import { serverTranslation } from "@i18n/server";
import { LogoutButton } from "@components/auth/LogoutButton";

export const Logout = async ({ className }: { className?: string }) => {
  const { t } = await serverTranslation("header");
  const allSessions = await loadSessionsFromCookies().catch((_error) => {
    logMessage.warn("Failed to load sessions for logout state");
    return [];
  });

  // Filter to only fully authenticated sessions (isSessionValid is async)
  const validSessions = await Promise.all(
    allSessions.map(async (session) => {
      if (!session?.factors?.user?.loginName) return null;
      const valid = await isSessionValid({ session });
      return valid ? session : null;
    })
  ).then((results) => results.filter(Boolean));

  if (validSessions.length < 1) {
    return null;
  }

  return <LogoutButton className={className} label={t("logout")} />;
};
