import type { ReactNode } from "react";
import { Suspense } from "react";
import { ThemeProvider } from "../app/_components/theme-provider";
import { NavProgress } from "../app/_components/nav-progress";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </ThemeProvider>
  );
}
