import { ShootDetailClient } from "@/components/shoot/shoot-detail-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ shootId: string }> };

export default async function ShootDetailPage({ params }: Props) {
  const { shootId } = await params;
  return <ShootDetailClient shootId={shootId} />;
}
