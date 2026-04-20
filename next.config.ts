import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { withAxiom } from "next-axiom";

const nextConfig: NextConfig = {
	pageExtensions: ["ts", "tsx", "mdx"],
};

const withMDX = createMDX({});

const configured = withAxiom(withMDX(nextConfig));

const sentryEnabled =
	Boolean(process.env.SENTRY_AUTH_TOKEN) &&
	Boolean(process.env.SENTRY_ORG) &&
	Boolean(process.env.SENTRY_PROJECT);

export default sentryEnabled
	? withSentryConfig(configured, {
			org: process.env.SENTRY_ORG,
			project: process.env.SENTRY_PROJECT,
			authToken: process.env.SENTRY_AUTH_TOKEN,
			silent: !process.env.CI,
			widenClientFileUpload: true,
			disableLogger: true,
			tunnelRoute: "/monitoring",
		})
	: configured;
