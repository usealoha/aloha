// Seeds (or updates) a row in `internal_users`. No self-signup path exists —
// this is the only way an admin is created.
//
// Usage:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' bun run scripts/seed-admin.ts
//
// If an admin already exists with that email, the password is reset. TOTP
// enrollment still happens on first login.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { internalUsers } from "@/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? null;
  const role =
    (process.env.ADMIN_ROLE as "owner" | "staff" | undefined) ?? "owner";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(internalUsers)
      .set({ passwordHash, name, role, updatedAt: new Date() })
      .where(eq(internalUsers.id, existing.id));
    console.log(`Updated admin ${email}`);
  } else {
    await db.insert(internalUsers).values({
      email,
      passwordHash,
      name,
      role,
    });
    console.log(`Created admin ${email}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
