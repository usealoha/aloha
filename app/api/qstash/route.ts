import { Receiver } from "@upstash/qstash";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

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

    console.log(`[QStash] Executing deployment for post: ${postId}`);

    // Simulate publishing
    await db.update(posts)
      .set({ 
        status: "published", 
        publishedAt: new Date() 
      })
      .where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[QStash] Error executing post:", error);
    
    await db.update(posts)
      .set({ status: "failed" })
      .where(eq(posts.id, postId));
      
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
