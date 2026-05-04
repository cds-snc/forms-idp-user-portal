/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { type Client, createClientFor } from "@zitadel/client";
import { IdentityProviderService } from "@zitadel/proto/zitadel/idp/v2/idp_service_pb";
import { OIDCService } from "@zitadel/proto/zitadel/oidc/v2/oidc_service_pb";
import { OrganizationService } from "@zitadel/proto/zitadel/org/v2/org_service_pb";
import { SessionService } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { SettingsService } from "@zitadel/proto/zitadel/settings/v2/settings_service_pb";
import { UserService } from "@zitadel/proto/zitadel/user/v2/user_service_pb";

import { logMessage } from "@lib/logger";

/*--------------------------------------------*
 * Parent Relative
 *--------------------------------------------*/
import { createServerTransport } from "../lib/zitadel";

import { getServiceUrlFromHeaders } from "./service-url";

const ServiceClass = {
  IdentityProviderService,
  UserService,
  OrganizationService,
  SessionService,
  OIDCService,
  SettingsService,
} as const;

type Services = (typeof ServiceClass)[keyof typeof ServiceClass];
class ServiceForHost {
  private services: Record<string, Client<Services>> = {};
  private token: string;
  constructor() {
    if (!process.env.ZITADEL_SERVICE_USER_TOKEN) {
      throw new Error("No token found");
    }
    this.token = process.env.ZITADEL_SERVICE_USER_TOKEN;
  }

  public async getServiceForHost<S extends keyof typeof ServiceClass>(service: S) {
    if (!this.services[service]) {
      logMessage.debug(`[ZITADEL SERVICE]: Creating service for ${service}`);
      const { serviceUrl } = await getServiceUrlFromHeaders();
      const transport = createServerTransport(this.token, serviceUrl);
      this.services[service] = createClientFor(ServiceClass[service])(transport);
    }
    logMessage.debug(`[ZITADEL SERVICE]: Getting service for ${service}`);
    return this.services[service] as Client<(typeof ServiceClass)[S]>;
  }
}
export const { getServiceForHost } = new ServiceForHost();
