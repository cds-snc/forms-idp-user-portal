/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { ZITADEL_ORGANIZATION } from "@root/constants/config";

export type SiteId = "dev" | "staging" | "production";
export type SiteConfig = {
  id: SiteId;
  baseUrl: string;
  zitadelOrganizationId: string;
};

export type SiteLinkKey = "home" | "about" | "termsOfUse" | "sla" | "support" | "gcForms";
type ConfigurableSiteLinkKey = Exclude<SiteLinkKey, "home">;

// Use URL templates with {baseUrl} and optional {locale}; set false to hide a link.
type SiteLinkValue = string | false;
type SiteLinksConfig = Record<ConfigurableSiteLinkKey, SiteLinkValue>;

type TrustedDomainConfig = Pick<SiteConfig, "baseUrl"> & {
  links: SiteLinksConfig;
};

const TRUSTED_DOMAINS: Record<SiteId, TrustedDomainConfig> = {
  dev: {
    baseUrl: "http://localhost:3000",
    links: {
      about: false,
      termsOfUse: false,
      sla: false,
      support: false,
      gcForms: "https://forms-formulaires.alpha.canada.ca/{locale}/profile/oidc",
    },
  },
  staging: {
    baseUrl: "https://forms-staging.cdssandbox.xyz",
    links: {
      about: false,
      termsOfUse: false,
      sla: false,
      support: false,
      gcForms: "https://forms-formulaires.alpha.canada.ca/{locale}/profile/oidc",
    },
  },
  production: {
    baseUrl: "https://forms-formulaires.alpha.canada.ca",
    links: {
      about: false,
      termsOfUse: false,
      sla: false,
      support: false,
      gcForms: "https://forms-formulaires.alpha.canada.ca/{locale}/profile/oidc",
    },
  },
};

function normalizeHost(rawHost: string): string {
  return (
    rawHost
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .replace(/:\d+$/, "") || ""
  );
}

const TRUSTED_SITE_HOSTS = Object.values(TRUSTED_DOMAINS).map((config) => {
  return normalizeHost(config.baseUrl);
});

class SiteConfigService {
  private static instance: SiteConfigService;

  private constructor(private readonly configById: Record<SiteId, TrustedDomainConfig>) {}

  static getInstance() {
    if (!SiteConfigService.instance) {
      SiteConfigService.instance = new SiteConfigService(TRUSTED_DOMAINS);
    }

    return SiteConfigService.instance;
  }

  requestHost(host: string): SiteId {
    if (host.includes("forms-staging") || process.env.REVIEW_ENV) {
      return "staging";
    } else if (host.includes("localhost") || host === "") {
      return "dev";
    } else {
      return "production";
    }
  }

  resolve(rawHost: string): SiteConfig {
    const id = this.requestHost(normalizeHost(rawHost));
    const defaults = this.configById[id];

    return {
      id,
      baseUrl: defaults.baseUrl,
      zitadelOrganizationId: ZITADEL_ORGANIZATION,
    };
  }
}

export const siteConfig = SiteConfigService.getInstance();

export const requestHost = (host: string): SiteId => siteConfig.requestHost(host);

export const resolveSiteConfigByHost = (rawHost: string): SiteConfig => siteConfig.resolve(rawHost);

export const isTrustedSiteHost = (rawHost: string): boolean => {
  const normalizedHost = normalizeHost(rawHost);

  // Check for exact match
  if (TRUSTED_SITE_HOSTS.includes(normalizedHost)) {
    return true;
  }

  // Check if it's a subdomain of a trusted host
  return TRUSTED_SITE_HOSTS.some((trustedHost) => {
    return normalizedHost.endsWith(`.${trustedHost}`);
  });
};

const resolveSiteLinkTemplate = (
  site: Pick<SiteConfig, "id" | "baseUrl">,
  linkKey: SiteLinkKey
) => {
  if (linkKey === "home") {
    return "{baseUrl}";
  }

  const links = TRUSTED_DOMAINS[site.id].links;
  return links[linkKey];
};

export function getSiteLink<K extends SiteLinkKey>(
  site: Pick<SiteConfig, "id" | "baseUrl">,
  linkKey: K,
  locale: string
): K extends "home" ? string : string | false {
  const linkTemplate = resolveSiteLinkTemplate(site, linkKey);
  const resolvedLocale = locale || "en";

  if (linkTemplate === false) {
    return false as K extends "home" ? string : string | false;
  }

  return linkTemplate
    .replaceAll("{baseUrl}", site.baseUrl)
    .replaceAll("{locale}", resolvedLocale) as K extends "home" ? string : string | false;
}
