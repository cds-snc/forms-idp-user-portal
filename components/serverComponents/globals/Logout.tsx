import { headers } from "next/headers";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import Link from "next/link";
import { serverTranslation } from "@i18n/server";
import { getAllSessionCookieIds } from "@lib/cookies";
import { listSessions } from "@lib/zitadel";

async function loadSessions({ serviceUrl }: { serviceUrl: string }) {
  const cookieIds = await getAllSessionCookieIds();

  if (cookieIds && cookieIds.length) {
    const response = await listSessions({
      serviceUrl,
      ids: cookieIds.filter((id) => !!id) as string[],
    });
    return response?.sessions ?? [];
  } else {
    return [];
  }
}

export const Logout = async () => {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { t } = await serverTranslation("header");
  const sessions = await loadSessions({ serviceUrl }).then((list) =>
    list.filter((session) => session?.factors?.user?.loginName)
  );
  if (sessions.length < 1) {
    return null;
  }

  return (
    <Link href="/logout" aria-label={t("logout")} prefetch={false}>
      {t("logout")}
    </Link>
  );
};
