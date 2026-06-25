import Link from "next/link";

export default function ShootsPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/app" className="font-sans text-sm text-[#64748B] hover:underline">
              ← Command Center
            </Link>
            <h1 className="mt-2 font-serif text-3xl text-[#1E293B]">Shoots</h1>
            <p className="mt-1 font-sans text-sm text-[#64748B]">
              Plan shoots: shot lists, deliverables, crew, and schedules.
            </p>
          </div>
          <Link
            href="/app/shoots/new"
            className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
            style={{ background: "#E87C4D" }}
          >
            + New shoot
          </Link>
        </header>

        <div className="rounded-2xl border border-[#E8E0D8] bg-white p-8 text-center">
          <p className="font-sans text-[#64748B]">No shoots yet.</p>
          <p className="mt-1 font-sans text-sm text-[#94A3B8]">
            Start the wizard to plan your first shoot with AI.
          </p>
          <Link
            href="/app/shoots/new"
            className="mt-4 inline-block rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
            style={{ background: "#E87C4D" }}
          >
            Plan a shoot
          </Link>
        </div>
      </div>
    </div>
  );
}
