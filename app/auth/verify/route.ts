import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";
import { consumeVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates/welcome";

function redirect(path: string, origin: string) {
  return NextResponse.redirect(new URL(path, origin));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/auth/verify/invalid", url.origin);
  }

  const result = await consumeVerificationToken(token);
  if (!result) {
    return redirect("/auth/verify/invalid", url.origin);
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, result.email))
    .limit(1);

  if (!user) {
    return redirect("/auth/verify/invalid", url.origin);
  }

  const alreadyVerified = !!user.emailVerified;

  if (!alreadyVerified) {
    await db
      .update(users)
      .set({ emailVerified: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    try {
      const tpl = welcomeEmail({ name: user.name, appUrl: env.APP_URL });
      await sendEmail({ to: user.email, ...tpl });
    } catch (err) {
      console.error("Failed to send welcome email", err);
    }
  }

  return redirect(
    `/auth/signin?verified=1&email=${encodeURIComponent(user.email)}`,
    url.origin,
  );
}
