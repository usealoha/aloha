import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/lib/admin/session";
import { AdminSidebar } from "../_components/admin-sidebar";
import { AdminTopBar } from "../_components/admin-top-bar";

// Hard guard: anything under the gated group 404s without a valid admin
// session, making the surface invisible to anyone who isn't signed in.
export default async function GatedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AdminSidebar email={admin.email} role={admin.role} />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopBar email={admin.email} role={admin.role} />
        <main className="flex-1">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
