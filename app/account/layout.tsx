import { SiteHeader } from "@components/siteHeader/SiteHeader";
import { Logout } from "@components/serverComponents/globals/Logout";
import LanguageToggle from "@clientComponents/globals/LanguageToggle";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-soft">
      <SiteHeader>
        <div className="flex items-center gap-4">
          <Logout className="mr-2 text-sm" />
          <LanguageToggle />
        </div>
      </SiteHeader>
      <div>{children}</div>
    </div>
  );
}
