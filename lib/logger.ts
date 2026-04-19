// Axiom logger. Create a fresh instance per request/operation in
// serverless (state shouldn't persist across invocations) and `await
// log.flush()` before the function returns — Axiom buffers writes and
// will drop them otherwise.
//
//   import { Logger } from "@/lib/logger";
//   const log = new Logger({ source: "publishers" });
//   log.info("publishing", { postId });
//   await log.flush();
//
// In route handlers, `withAxiom` is more ergonomic:
//   import { withAxiom, type AxiomRequest } from "next-axiom";
//   export const POST = withAxiom((req: AxiomRequest) => {
//     req.log.info("hit"); return NextResponse.json({ ok: true });
//   });
export { Logger, withAxiom } from "next-axiom";
export type { AxiomRequest } from "next-axiom";
