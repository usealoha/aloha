import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCustomerPortalUrl } from "@/lib/billing/service";
import { env } from "@/lib/env";

// Brief hand-off to Polar's hosted portal for card/payment-method updates.
// Everything else (subscription management, invoices) stays in our UI.
export async function POST() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.redirect(new URL("/auth/signin", env.APP_URL));
	}

	const url = await createCustomerPortalUrl(session.user.id);
	if (!url) {
		return NextResponse.redirect(
			new URL("/app/settings/billing?portal_error=1", env.APP_URL),
			{ status: 303 },
		);
	}
	return NextResponse.redirect(url, { status: 303 });
}

export async function GET() {
	return POST();
}
