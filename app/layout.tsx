import type { Metadata } from "next";
import { Fraunces, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { DEFAULT_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: "/aloha.svg", type: "image/svg+xml" },
      { url: "/aloha.ico", sizes: "any" },
      { url: "/aloha.png", type: "image/png" },
    ],
    apple: { url: "/aloha.png", type: "image/png" },
    shortcut: "/aloha.ico",
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", fraunces.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
