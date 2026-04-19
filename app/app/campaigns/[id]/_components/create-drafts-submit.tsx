"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

// The accept form lives as a DOM island above the beat list (can't nest
// inside, since regen buttons are their own forms). `useFormStatus` relies
// on DOM descendancy, so instead we attach a submit listener to the
// referenced form and flip local state — same visual contract, works
// across the `form` attribute bridge.
export function CreateDraftsSubmit({ formId }: { formId: string }) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    const onSubmit = () => setPending(true);
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [formId]);

  return (
    <button
      type="submit"
      form={formId}
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {pending ? "Creating drafts…" : "Create drafts"}
    </button>
  );
}
