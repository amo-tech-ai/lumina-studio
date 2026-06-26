import Link from "next/link";
import { ChannelPreviewStudio } from "@/components/media/channel-preview-studio";
import { getAllChannelSpecs } from "@/lib/media/channel-specs.server";

export default async function ChannelPreviewPage() {
  const specs = await getAllChannelSpecs();

  return (
    <div className="min-h-screen p-8">
      <Link
        href="/app"
        className="text-sm text-[var(--muted-foreground)] hover:underline"
      >
        ← Command Center
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Channel Preview
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
        See how an image or video renders in each placement before you publish.
        Frames use the live spec dimensions and safe zones from{" "}
        <code className="text-xs">image_specs</code>.
      </p>
      <div className="mt-8">
        <ChannelPreviewStudio specs={specs} />
      </div>
    </div>
  );
}
