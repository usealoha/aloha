import { and, desc, eq } from "drizzle-orm";
import { Sparkles, Upload, Wand2 } from "lucide-react";
import { db } from "@/db";
import { platformContentCache } from "@/db/schema";
import { trainVoiceAction } from "@/app/actions/voice";
import { loadCurrentVoice } from "@/lib/ai/voice";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const RECENT_SAMPLE_LIMIT = 20;

export default async function MuseSettingsPage() {
  const user = (await getCurrentUser())!;

  const [voice, recentSamples] = await Promise.all([
    loadCurrentVoice(user.id),
    db
      .select({
        id: platformContentCache.id,
        platform: platformContentCache.platform,
        content: platformContentCache.content,
        platformPostedAt: platformContentCache.platformPostedAt,
      })
      .from(platformContentCache)
      .where(and(eq(platformContentCache.userId, user.id)))
      .orderBy(desc(platformContentCache.platformPostedAt))
      .limit(RECENT_SAMPLE_LIMIT),
  ]);

  const currentTone = (voice?.tone ?? {}) as {
    summary?: string;
    descriptors?: string[];
  };
  const currentFeatures = (voice?.features ?? {}) as {
    hook_patterns?: string[];
    positive_examples?: string[];
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          Muse — your voice
        </h2>
        <p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
          Muse is Aloha&apos;s style-trained AI layer. Train it on your own
          writing and the sliders you pick below; every Muse-enabled channel
          then generates in that voice. You can retrain any time — the
          profile&apos;s versioned.
        </p>
      </div>

      {voice ? <CurrentVoiceCard voice={voice} tone={currentTone} features={currentFeatures} /> : null}

      <form action={trainVoiceAction} className="space-y-8">
        <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-6">
          <header className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Wand2 className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">Voice sliders</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                The trainer reads these alongside your corpus. Even with no
                corpus, the sliders are enough to produce a working baseline.
              </p>
            </div>
          </header>

          <div className="grid gap-6">
            <Slider name="formality" label="Casual ↔ Formal" />
            <Slider name="detail" label="Concise ↔ Detailed" />
            <Slider name="wit" label="Earnest ↔ Witty" />
            <PerspectivePicker />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-4">
          <header className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Sparkles className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">Pull your past posts</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                Pick posts that sound most like you. Leave unchecked and
                we&apos;ll auto-pick the most recent 100 across every
                connected channel.
              </p>
            </div>
          </header>

          {recentSamples.length === 0 ? (
            <p className="text-[12.5px] text-ink/60 leading-[1.55]">
              No posts cached yet. The nightly read-back will populate this
              after your next sync. You can still train from the sliders and
              uploaded text below.
            </p>
          ) : (
            <SamplePicker samples={recentSamples} />
          )}
        </section>

        <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-4">
          <header className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Upload className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">Paste additional text</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                Newsletter drafts, blog posts, anything that sounds like you.
                Optional — mix with sample posts or use on its own.
              </p>
            </div>
          </header>
          <textarea
            name="uploadedCorpus"
            placeholder="Paste posts, newsletters, transcripts — anything that sounds like you."
            className="w-full min-h-[160px] rounded-xl border border-border bg-background px-4 py-3 text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
          />
        </section>

        <div className="flex items-center justify-end gap-3">
          <p className="text-[12px] text-ink/55">
            Training takes ~10 seconds. Runs on Gemini Pro via OpenRouter.
          </p>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            {voice ? "Retrain voice" : "Train voice"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Slider({ name, label }: { name: string; label: string }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-ink/75">{label}</span>
        <output
          htmlFor={name}
          className="text-[12px] text-ink/50 tabular-nums"
        >
          50
        </output>
      </div>
      <input
        id={name}
        name={name}
        type="range"
        min={0}
        max={100}
        defaultValue={50}
        className="mt-2 w-full accent-ink"
      />
    </label>
  );
}

function PerspectivePicker() {
  const options = [
    { value: "first-person", label: "I / me" },
    { value: "third-person", label: "They / the team" },
    { value: "mixed", label: "Mixed" },
  ] as const;
  return (
    <fieldset>
      <legend className="text-[13px] text-ink/75">Perspective</legend>
      <div className="mt-2 flex gap-2 flex-wrap">
        {options.map((opt, idx) => (
          <label
            key={opt.value}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-border bg-background text-[12.5px] text-ink/75 cursor-pointer has-[:checked]:bg-ink has-[:checked]:text-background has-[:checked]:border-ink"
          >
            <input
              type="radio"
              name="perspective"
              value={opt.value}
              defaultChecked={idx === 2}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SamplePicker({
  samples,
}: {
  samples: Array<{
    id: string;
    platform: string;
    content: string;
    platformPostedAt: Date | null;
  }>;
}) {
  return (
    <>
      <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {samples.map((s) => (
          <li key={s.id} className="flex items-start gap-3 px-4 py-3">
            <input
              type="checkbox"
              name="samplePostIds"
              value={s.id}
              className="mt-1 accent-ink"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-ink/55 uppercase tracking-[0.16em]">
                <span>{s.platform}</span>
                {s.platformPostedAt ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(s.platformPostedAt)}
                    </span>
                  </>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] text-ink/80 leading-[1.5] line-clamp-3">
                {s.content}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11.5px] text-ink/50">
        Leave all unchecked to auto-pick the most recent 100 posts across every
        connected channel.
      </p>
    </>
  );
}

function CurrentVoiceCard({
  voice,
  tone,
  features,
}: {
  voice: { trainedAt: Date | null; version: number; emojiRate: string | null; bannedPhrases: string[]; ctaStyle: string | null };
  tone: { summary?: string; descriptors?: string[] };
  features: { hook_patterns?: string[]; positive_examples?: string[] };
}) {
  return (
    <section className="rounded-3xl border border-border bg-peach-100/50 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Current voice · v{voice.version}
          </p>
          <p className="mt-2 font-display text-[22px] leading-[1.2] text-ink">
            {tone.summary ?? "Profile trained."}
          </p>
        </div>
        {voice.trainedAt ? (
          <p className="text-[12px] text-ink/55">
            Trained{" "}
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(voice.trainedAt)}
          </p>
        ) : null}
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
        {tone.descriptors && tone.descriptors.length > 0 ? (
          <Field label="Tone">{tone.descriptors.join(" · ")}</Field>
        ) : null}
        {features.hook_patterns && features.hook_patterns.length > 0 ? (
          <Field label="Hooks">{features.hook_patterns.join(" · ")}</Field>
        ) : null}
        {voice.ctaStyle ? <Field label="CTA style">{voice.ctaStyle}</Field> : null}
        {voice.emojiRate ? (
          <Field label="Emoji rate">{voice.emojiRate}</Field>
        ) : null}
        {voice.bannedPhrases.length > 0 ? (
          <Field label="Avoid">{voice.bannedPhrases.join(", ")}</Field>
        ) : null}
      </dl>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.18em] text-ink/50">
        {label}
      </dt>
      <dd className="mt-1 text-ink/80">{children}</dd>
    </div>
  );
}
