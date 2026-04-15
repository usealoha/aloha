import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { env } from "@/lib/env";
import { getInvoiceUrl } from "@/lib/billing/service";

export async function GET(
	_req: NextRequest,
	ctx: RouteContext<"/api/billing/invoice/[id]">,
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.redirect(new URL("/auth/signin", env.APP_URL));
	}

	const { id } = await ctx.params;
	const url = await getInvoiceUrl(session.user.id, id);
	if (!url) {
		return new NextResponse("Invoice not found", { status: 404 });
	}

	return NextResponse.redirect(url, { status: 303 });
}
