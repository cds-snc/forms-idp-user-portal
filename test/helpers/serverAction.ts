import { headers } from "next/headers";
import { vi } from "vitest";

import { getServiceUrlFromHeaders } from "@lib/service-url";
import { serverTranslation } from "@i18n/server";

export const TEST_SERVICE_URL = "https://idp.example";

export const setupServerActionContext = () => {
  vi.mocked(headers).mockResolvedValue(new Headers());
  vi.mocked(getServiceUrlFromHeaders).mockReturnValue({
    serviceUrl: TEST_SERVICE_URL,
  });
  vi.mocked(serverTranslation).mockResolvedValue({
    t: (key: string) => `translated:${key}`,
  } as never);
};
