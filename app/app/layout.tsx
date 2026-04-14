import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { routes } from "@/lib/routes";
import { AppNav } from "./_components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${routes.signin}?callbackUrl=/app/dashboard`);
  }
  if (!user.onboardedAt) {
    redirect(routes.onboarding.workspace);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppNav user={user} />
      <main className="flex-1">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
          {children}
        </div>
      </main>
    </div>
  );
}
