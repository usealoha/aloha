"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/auth";

export type AuthFormState = {
  error: string | null;
};

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

function normalizeRedirect(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/app/dashboard";
}

export async function signinWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const redirectTo = normalizeRedirect(formData.get("redirectTo"));

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email or password is incorrect." };
    }
    throw err;
  }

  return { error: null };
}

export async function signupWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path[0];
    if (field === "password") {
      return { error: "Password must be at least 8 characters." };
    }
    if (field === "email") {
      return { error: "Enter a valid email address." };
    }
    return { error: "Please fill in every field." };
  }

  const email = parsed.data.email.toLowerCase();
  const redirectTo = normalizeRedirect(formData.get("redirectTo"));

  const [existing] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing?.passwordHash) {
    return { error: "An account with that email already exists. Sign in instead." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, name: parsed.data.name, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      name: parsed.data.name,
      email,
      passwordHash,
    });
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created, but we couldn't sign you in. Try signing in." };
    }
    throw err;
  }

  return { error: null };
}
