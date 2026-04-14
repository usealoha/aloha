import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { AuthShell } from "../../_components/auth-shell";

export const metadata = makeMetadata({
  title: "Verification link expired",
  description: "This verification link is invalid or has expired.",
  path: "/auth/verify/invalid",
  noindex: true,
});

export default function VerifyInvalidPage() {
  return (
    <AuthShell
      eyebrow="Couldn't verify"
      title={
        <>
          That link
          <br />
          <span className="text-primary font-light">won&apos;t open.</span>
        </>
      }
      subtitle="Verification links work once and expire after 24 hours. Try signing in — we'll send you a fresh one."
      footer={
        <p>
          New here?{" "}
          <Link
            href="/auth/signup"
            className="pencil-link text-ink font-medium"
          >
            Create a workspace
          </Link>
          .
        </p>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-border-strong bg-background-elev px-5 py-5 flex items-start gap-4">
          <div className="mt-[2px] w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-ink" />
          </div>
          <div className="flex-1">
            <p className="text-[14.5px] text-ink font-medium">Link expired or already used</p>
            <p className="mt-1 text-[13px] text-ink/65 leading-[1.55]">
              Sign in with your email and password — if your account isn&apos;t
              verified yet, we&apos;ll send a new link automatically.
            </p>
          </div>
        </div>

        <Link
          href="/auth/signin"
          className="block w-full h-12 px-5 inline-flex items-center justify-center rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
