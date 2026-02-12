import { GcFormsHeader } from "@components/global/GcFormsHeader";
import { AccountNav } from "@serverComponents/AccountNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <GcFormsHeader showLanguageToggle={true}>
        <div className="flex items-center gap-4">
          <button className="rounded bg-blue-dark px-4 py-2 text-sm font-medium text-white hover:bg-blue-hover">
            Account
          </button>
        </div>
      </GcFormsHeader>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Left Navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <AccountNav />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="rounded-lg border border-gray-200 bg-white p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
