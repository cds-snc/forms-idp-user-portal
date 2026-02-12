import { GcFormsHeader } from "@components/global/GcFormsHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <GcFormsHeader>{children}</GcFormsHeader>
      <div className="bg-blend-soft-light">{children}</div>
    </div>
  );
}
