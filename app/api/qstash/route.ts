import { Receiver } from "@upstash/qstash";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { publishPost } from "@/lib/publishers";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });

  const body = await req.text();
  const isValid = await receiver.verify({
    signature,
    body,
  });

  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const parsedBody = JSON.parse(body);
  const { postId } = parsedBody;

  if (!postId) {
    return new NextResponse("Post ID is required", { status: 400 });
  }

  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    if (post.status !== "scheduled") {
      return new NextResponse("Post is not in scheduled state", { status: 400 });
    }

    console.log(`[QStash] Publishing post: ${postId}`);
    const summary = await publishPost(postId);
    // Surface a 5xx only when nothing published and every failure is
    // retryable (rate-limited / transient). QStash will retry with backoff.
    // Any success, or any terminal failure (needs_reauth / forbidden /
    // invalid_content), returns 200 so we don't double-post or loop forever.
    if (summary.retryable) {
      return new NextResponse("Retryable publish failure", { status: 503 });
    }
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[QStash] Error publishing post:", error);
    // publishPost handles per-platform failure; only whole-dispatcher
    // crashes land here — treat as unrecoverable for this run.
    await db.update(posts)
      .set({ status: "failed" })
      .where(eq(posts.id, postId));

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
