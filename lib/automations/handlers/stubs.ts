import "server-only";
import {
  registerAction,
  registerCondition,
  type ActionContext,
  type ActionResult,
  type ConditionContext,
} from "../registry";

// Every action/condition referenced by a template lives here as a stub. Each
// logs what it *would* do and returns a plausible output so downstream steps
// and the run-history UI have something to render. Replace these with real
// integrations one at a time by calling `registerAction("kind", handler)`
// from a new file — duplicate registration throws, which is the signal to
// delete the stub below first.

function stubAction(kind: string) {
  return async (ctx: ActionContext): Promise<ActionResult> => {
    console.info(
      `[automations] stub action "${kind}" for automation=${ctx.automationId} step=${ctx.step.id}`,
      { config: ctx.step.config, trigger: ctx.trigger },
    );
    return { output: { stubbed: true, kind, at: new Date().toISOString() } };
  };
}

function stubCondition(kind: string, result: boolean) {
  return async (ctx: ConditionContext): Promise<boolean> => {
    console.info(
      `[automations] stub condition "${kind}" → ${result} for automation=${ctx.automationId} step=${ctx.step.id}`,
      { config: ctx.step.config },
    );
    return result;
  };
}

// ── Actions ──────────────────────────────────────────────────────────────

registerAction("send_email", stubAction("send_email"));
registerAction("post_to_slack", stubAction("post_to_slack"));
registerAction("send_digest_email", stubAction("send_digest_email"));
registerAction("send_dm", stubAction("send_dm"));
registerAction("repost_top", stubAction("repost_top"));
registerAction(
  "find_stale_subscribers",
  async (ctx): Promise<ActionResult> => {
    console.info(
      `[automations] stub action "find_stale_subscribers" for automation=${ctx.automationId}`,
    );
    // Shape the output so `send_email` downstream has something to look at.
    return {
      output: {
        stubbed: true,
        kind: "find_stale_subscribers",
        subscriberIds: [],
      },
    };
  },
);
registerAction("muse_draft_post", stubAction("muse_draft_post"));
registerAction("publish_post", stubAction("publish_post"));
registerAction("save_as_draft", stubAction("save_as_draft"));
registerAction("send_alert", stubAction("send_alert"));
registerAction("send_broadcast", stubAction("send_broadcast"));

// ── Conditions ───────────────────────────────────────────────────────────

// Default stubs return `true` so the "if yes" branch lights up in dev — real
// evaluators will replace these one by one.
registerCondition("keyword_match", stubCondition("keyword_match", true));
registerCondition("approval_status", stubCondition("approval_status", true));
registerCondition(
  "rate_over_threshold",
  stubCondition("rate_over_threshold", false),
);
