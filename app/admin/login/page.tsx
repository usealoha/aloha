import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin/session";
import { LoginForm } from "../_components/login-form";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[28px] leading-none font-semibold tracking-[-0.03em] text-ink">
              Aloha
            </span>
            <span className="font-display text-primary text-[22px] leading-none">
              .
            </span>
            <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Admin
            </span>
          </div>
          <h1 className="font-display text-2xl font-light text-ink">
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Restricted. Operators only.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
