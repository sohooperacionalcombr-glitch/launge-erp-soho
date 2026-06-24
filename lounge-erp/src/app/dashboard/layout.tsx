import { Sidebar } from "@/components/layout/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-night-900">
      <Sidebar />
      {/* lg:pl-[240px] desloca o conteúdo pela largura da sidebar apenas em desktop */}
      <main className="min-h-screen lg:pl-[240px]">
        {/* pt-[70px] = espaço do header mobile fixo; pb-24 = espaço da bottom nav */}
        <div className="px-4 sm:px-6 lg:px-8 pt-[70px] lg:pt-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
