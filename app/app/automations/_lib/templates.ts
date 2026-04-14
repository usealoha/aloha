import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  CalendarClock,
  Mail,
  MessageSquare,
  Repeat2,
  Send,
  UserPlus,
  Clock,
  PenSquare,
} from "lucide-react";

export type AutomationKind =
  | "welcome_email"
  | "post_announcement"
  | "weekly_digest"
  | "reply_auto"
  | "scheduled_repost";

export type FlowNode = {
  type: "trigger" | "action";
  icon: LucideIcon;
  title: string;
  detail: string;
};

export type AutomationTemplate = {
  kind: AutomationKind;
  name: string;
  summary: string;
  icon: LucideIcon;
  nodes: FlowNode[];
};

export const TEMPLATES: Record<AutomationKind, AutomationTemplate> = {
  welcome_email: {
    kind: "welcome_email",
    name: "Welcome new subscribers",
    summary:
      "Send a short, personal welcome the moment someone joins your list.",
    icon: Mail,
    nodes: [
      {
        type: "trigger",
        icon: UserPlus,
        title: "Subscriber joined",
        detail: "When a new person opts in from your public page",
      },
      {
        type: "action",
        icon: Send,
        title: "Send welcome email",
        detail: "Delivers your welcome template within 60 seconds",
      },
    ],
  },
  post_announcement: {
    kind: "post_announcement",
    name: "Tell the team when a post is live",
    summary:
      "Get a quiet ping in Slack each time Aloha publishes on your behalf.",
    icon: BellRing,
    nodes: [
      {
        type: "trigger",
        icon: PenSquare,
        title: "Post published",
        detail: "After a scheduled post successfully goes out",
      },
      {
        type: "action",
        icon: MessageSquare,
        title: "Post to Slack",
        detail: "Notify your workspace's configured channel",
      },
    ],
  },
  weekly_digest: {
    kind: "weekly_digest",
    name: "Weekly digest to subscribers",
    summary:
      "Collect the week's posts and send them as one tidy newsletter each Sunday.",
    icon: CalendarClock,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Every Sunday, 10am",
        detail: "Uses your workspace timezone",
      },
      {
        type: "action",
        icon: Mail,
        title: "Email digest",
        detail: "Compiles the week's posts into a single email",
      },
    ],
  },
  reply_auto: {
    kind: "reply_auto",
    name: "Reply to first-time followers",
    summary:
      "Send a short thank-you DM when someone follows one of your channels.",
    icon: MessageSquare,
    nodes: [
      {
        type: "trigger",
        icon: UserPlus,
        title: "New follower",
        detail: "Detected across your connected channels",
      },
      {
        type: "action",
        icon: MessageSquare,
        title: "Send DM",
        detail: "Your saved first-reply template, personalized with their name",
      },
    ],
  },
  scheduled_repost: {
    kind: "scheduled_repost",
    name: "Repost your top performer",
    summary:
      "Every two weeks, re-share the best-performing post from the prior window.",
    icon: Repeat2,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Every 14 days",
        detail: "Measured against the previous cycle",
      },
      {
        type: "action",
        icon: Send,
        title: "Repost winner",
        detail: "Re-queues with a fresh caption",
      },
    ],
  },
};

export const TEMPLATE_LIST: AutomationTemplate[] = Object.values(TEMPLATES);
