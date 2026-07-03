"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";

const TAB_IDS = [
  "overview",
  "shots",
  "assets",
  "team",
  "schedule",
  "budget",
  "approvals",
  "deliverables",
  "activity",
] as const;

type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  shots: "Shot List",
  assets: "Assets",
  team: "Team",
  schedule: "Schedule",
  budget: "Budget",
  approvals: "Approvals",
  deliverables: "Deliverables",
  activity: "Activity",
};

function Placeholder({ label }: { label: string }) {
  return (
    <p className="font-sans text-sm text-[#64748B]">
      {label} — wired in follow-up (handoff 02 § Shoot Detail 9-tab map).
    </p>
  );
}

export function ShootDetailClient({ shootId }: { shootId: string }) {
  const [data, setData] = useState<ShootDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/shoots/${shootId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ShootDetailPayload>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shootId]);

  if (loading) {
    return (
      <div className="p-6 font-sans text-sm text-[#64748B]">Loading shoot…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 space-y-3">
        <Link href="/app/shoots" className="font-sans text-sm text-[#64748B] hover:underline">
          ← Shoots
        </Link>
        <p className="font-sans text-sm text-[#DC2626]">{error ?? "Shoot not found"}</p>
      </div>
    );
  }

  const { shoot, brand, deliverables, shots } = data;

  return (
    <div className="min-h-screen bg-[#FBF8F5] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link href="/app/shoots" className="font-sans text-sm text-[#64748B] hover:underline">
            ← Shoots
          </Link>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-[#1E293B]">{shoot.name}</h1>
              <p className="mt-1 font-sans text-sm text-[#64748B]">
                {brand.name} · {shoot.status.replace("_", " ")}
              </p>
            </div>
            <span className="rounded-full border border-[#E8E0D8] bg-white px-3 py-1 font-sans text-xs text-[#64748B]">
              ID {shoot.id.slice(0, 8)}…
            </span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-white p-1">
            {TAB_IDS.map((id) => (
              <TabsTrigger key={id} value={id} className="font-sans text-xs sm:text-sm">
                {TAB_LABELS[id]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4 rounded-2xl border border-[#E8E0D8] bg-white p-5">
            <div className="space-y-4 font-sans text-sm text-[#1E293B]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Brief</p>
                <p className="mt-1 text-[#64748B]">{shoot.brief ?? "No brief yet."}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Channels</p>
                <p className="mt-1 text-[#64748B]">
                  {shoot.target_channels.length
                    ? shoot.target_channels.join(", ")
                    : "None selected"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[#94A3B8]">Deliverables</p>
                  <p className="text-lg font-semibold">{deliverables.length}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Shots</p>
                  <p className="text-lg font-semibold">{shots.length}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Budget</p>
                  <p className="text-lg font-semibold">
                    {shoot.estimated_budget != null
                      ? `$${Number(shoot.estimated_budget).toLocaleString()}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shots" className="mt-4 rounded-2xl border border-[#E8E0D8] bg-white p-5">
            {shots.length === 0 ? (
              <Placeholder label="Shot list empty" />
            ) : (
              <ul className="space-y-3">
                {shots.map((shot) => (
                  <li
                    key={shot.id}
                    className="rounded-xl border border-[#E8E0D8] p-3 font-sans text-sm"
                  >
                    <span className="font-semibold text-[#1E293B]">#{shot.shot_number}</span>{" "}
                    {shot.description}
                    {shot.style_notes ? (
                      <p className="mt-1 text-xs text-[#64748B]">{shot.style_notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="deliverables" className="mt-4 rounded-2xl border border-[#E8E0D8] bg-white p-5">
            {deliverables.length === 0 ? (
              <Placeholder label="No deliverables" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full font-sans text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E0D8] text-left text-xs text-[#94A3B8]">
                      <th className="pb-2 pr-4">Channel</th>
                      <th className="pb-2 pr-4">Format</th>
                      <th className="pb-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.map((d) => (
                      <tr key={d.id} className="border-b border-[#F1EDE8]">
                        <td className="py-2 pr-4">{d.channel}</td>
                        <td className="py-2 pr-4">{d.format ?? "—"}</td>
                        <td className="py-2">{d.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {(["assets", "team", "schedule", "budget", "approvals", "activity"] as TabId[]).map(
            (id) => (
              <TabsContent
                key={id}
                value={id}
                className="mt-4 rounded-2xl border border-[#E8E0D8] bg-white p-5"
              >
                <Placeholder label={TAB_LABELS[id]} />
              </TabsContent>
            ),
          )}
        </Tabs>
      </div>
    </div>
  );
}
