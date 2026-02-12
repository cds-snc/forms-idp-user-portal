"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@lib/utils";
import { I18n } from "@i18n";

interface NavItem {
  href: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: "/account", labelKey: "account.nav.account" },
  { href: "/account/profile", labelKey: "account.nav.profile" },
];

export const AccountNav = () => {
  const pathname = usePathname();

  return (
    <nav className="w-full" aria-label="Account settings">
      <h2 className="mb-6 text-2xl font-bold">
        <I18n i18nKey="account.settings" namespace="common" />
      </h2>
      <ul className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded px-4 py-2 text-base transition-colors",
                  isActive
                    ? "bg-blue-dark text-white-default font-semibold"
                    : "text-blue-dark hover:bg-gray-100"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <I18n i18nKey={item.labelKey} namespace="common" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
