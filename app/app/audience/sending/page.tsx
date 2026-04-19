import { db } from "@/db";
import { sendingDomains } from "@/db/schema";
import { hasBroadcastEntitlement } from "@/lib/billing/broadcasts";
import { getCurrentUser } from "@/lib/current-user";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, CheckCircle2, Clock, Globe, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addSendingDomain,
  updateSendingDomainTracking,
  verifySendingDomain,
} from "@/app/actions/sending-domains";
import { DeleteDomainButton } from "./_components/delete-domain";

export const dynamic = "force-dynamic";

type Rec = { name: string; type: string; value: string };

export default async function SendingDomainsPage() {
  const user = (await getCurrentUser())!;

  // Without broadcast entitlement, this page has no point — sending
  // domains are only useful once you can send. Bounce to the broadcasts
  // page, which shows the early-access copy.
  if (!(await hasBroadcastEntitlement(user.id))) {
    redirect("/app/broadcasts");
  }

  const domains = await db
    .select()
    .from(sendingDomains)
    .where(eq(sendingDomains.userId, user.id))
    .orderBy(desc(sendingDomains.createdAt));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Link
          href="/app/audience"
          className="inline-flex items-center gap-1.5 text-[12px] text-ink/60 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Audience
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Email · sending domain
        </p>
        <h1 className="font-display text-[40px] lg:text-[48px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
          Send from your
          <span className="text-primary"> own domain.</span>
        </h1>
        <p className="text-[14px] text-ink/65 max-w-2xl leading-[1.55]">
          Broadcasts go out from an address you control. Add a subdomain
          (like <code className="px-1 py-0.5 rounded bg-muted text-ink/80">send.yourco.com</code>),
          drop the DNS records where they live, and verify. Takes a minute
          once the records propagate.
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Add a domain
          </p>
        </div>
        <form
          action={addSendingDomain}
          className="p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3"
        >
          <input
            type="text"
            name="domain"
            placeholder="send.yourco.com"
            required
            className="h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
          >
            Add domain
          </button>
          <p className="sm:col-span-2 text-[12px] text-ink/55">
            Use a dedicated subdomain — keeps your root deliverability clean
            if something ever goes sideways.
          </p>
        </form>
      </section>

      <section className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Your domains
        </p>

        {domains.length === 0 ? (
          <div className="rounded-3xl border border-border bg-background-elev px-6 py-12 text-center text-[13.5px] text-ink/55">
            Nothing here yet. Add a domain above to get started.
          </div>
        ) : (
          <ul className="space-y-4">
            {domains.map((d) => (
              <li
                key={d.id}
                className="rounded-3xl border border-border bg-background-elev overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-ink/55" />
                      <span className="font-display text-[20px] text-ink truncate">
                        {d.domain}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-ink/55">
                      Added{" "}
                      {new Date(d.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {d.lastCheckedAt ? (
                        <>
                          {" · "}last checked{" "}
                          {new Date(d.lastCheckedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                {d.status === "verified" ? (
                  <form
                    action={updateSendingDomainTracking}
                    className="px-6 py-5 border-b border-border space-y-3"
                  >
                    <input type="hidden" name="id" value={d.id} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                      Tracking
                    </p>
                    <p className="text-[12.5px] text-ink/60 max-w-xl">
                      Off by default. Turn on only if you want open + click
                      numbers in your broadcast reports — some subscribers
                      prefer the calm of no pixels or rewritten links.
                    </p>
                    <div className="flex flex-wrap gap-5 items-center pt-1">
                      <label className="inline-flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="openTracking"
                          defaultChecked={d.openTracking}
                          className="w-4 h-4 accent-primary"
                        />
                        Open tracking
                      </label>
                      <label className="inline-flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="clickTracking"
                          defaultChecked={d.clickTracking}
                          className="w-4 h-4 accent-primary"
                        />
                        Click tracking
                      </label>
                      <button
                        type="submit"
                        className="ml-auto inline-flex items-center h-9 px-4 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:bg-peach-100/60 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : null}

                {d.status !== "verified" && (d.dkimRecords?.length ?? 0) > 0 ? (
                  <div className="px-6 py-5 border-b border-border bg-muted/30">
                    <p className="text-[12.5px] text-ink/70">
                      Add these records at your DNS provider. Keep existing
                      records in place.
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-[12.5px] text-ink">
                        <thead>
                          <tr className="text-ink/55">
                            <th className="font-medium pb-2 pr-4">Type</th>
                            <th className="font-medium pb-2 pr-4">Name</th>
                            <th className="font-medium pb-2">Value</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono">
                          {(d.dkimRecords as Rec[]).map((r, i) => (
                            <tr key={i} className="align-top">
                              <td className="py-1.5 pr-4 whitespace-nowrap">
                                {r.type}
                              </td>
                              <td className="py-1.5 pr-4 break-all">{r.name}</td>
                              <td className="py-1.5 break-all">{r.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 px-6 py-3 bg-muted/30">
                  <p className="text-[12px] text-ink/55">
                    {d.status === "verified"
                      ? "Ready to send from this domain."
                      : d.status === "failed"
                        ? "Verification didn't pass. Double-check the records and try again."
                        : "Records added? Hit verify once DNS has propagated."}
                  </p>
                  <div className="flex items-center gap-2">
                    {d.status !== "verified" ? (
                      <form action={verifySendingDomain}>
                        <input type="hidden" name="id" value={d.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center h-9 px-4 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:bg-peach-100/60 transition-colors"
                        >
                          Verify
                        </button>
                      </form>
                    ) : null}
                    <DeleteDomainButton id={d.id} domain={d.domain} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-peach-100 border border-border text-[11.5px] font-medium text-ink">
        <CheckCircle2 className="w-3.5 h-3.5 text-primary-deep" />
        Verified
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-background border border-border-strong text-[11.5px] font-medium text-ink">
        <XCircle className="w-3.5 h-3.5 text-ink/70" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-background border border-border-strong text-[11.5px] font-medium text-ink/70">
      <Clock className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}
