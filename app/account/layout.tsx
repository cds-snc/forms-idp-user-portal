import { SiteHeader } from "@components/siteHeader/SiteHeader";
import { Logout } from "@components/serverComponents/globals/Logout";
import LanguageToggle from "@clientComponents/globals/LanguageToggle";

// Note: This is a single column layout as we don't need the left nav yet.

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-soft">
      <SiteHeader>
        <div className="flex items-center gap-4">
          <Logout className="mr-2 text-sm" />
          <LanguageToggle />
        </div>
      </SiteHeader>
      <main className="mx-auto max-w-[71.25rem] px-6 py-2 laptop:px-0">
        ˝<div className="mb-20 px-16">{children}</div>
      </main>
    </div>
  );
}
