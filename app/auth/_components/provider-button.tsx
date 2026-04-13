import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  GoogleIcon,
  LinkedInIcon,
  GitHubIcon,
  XIcon,
} from "./provider-icons";

type Provider = "google" | "linkedin" | "github" | "twitter";

const ICONS: Record<Provider, (p: { className?: string }) => ReactNode> = {
  google: GoogleIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  twitter: XIcon,
};

const LABELS: Record<Provider, string> = {
  google: "Continue with Google",
  linkedin: "Continue with LinkedIn",
  github: "Continue with GitHub",
  twitter: "Continue with X",
};

export function ProviderButton({
  provider,
  variant = "secondary",
  children,
}: {
  provider: Provider;
  variant?: "primary" | "secondary";
  children?: ReactNode;
}) {
  const Icon = ICONS[provider];
  const label = children ?? LABELS[provider];

  return (
    <button
      type="submit"
      className={cn(
        "group w-full h-12 px-5 inline-flex items-center justify-center gap-3 rounded-full text-[14px] font-medium transition-colors",
        variant === "primary"
          ? "bg-ink text-background hover:bg-primary"
          : "bg-background-elev text-ink border border-border-strong hover:border-ink"
      )}
    >
      <Icon className="w-[18px] h-[18px]" />
      <span>{label}</span>
    </button>
  );
}
