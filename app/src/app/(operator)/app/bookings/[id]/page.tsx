import { notFound } from "next/navigation";

import { BookingDetailWorkspace } from "@/components/booking/booking-detail-workspace";
import { getBooking } from "@/lib/booking/booking-service";
import { isUuid } from "@/lib/booking/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const result = await getBooking(supabase, id);

  if (!result.ok) {
    // 404/403 both mean "nothing to show this viewer" — don't leak which one.
    if (result.status === 404 || result.status === 403) notFound();
    return (
      <BookingDetailWorkspace
        bookingId={id}
        booking={null}
        talent={null}
        history={[]}
        viewerRole={null}
        fetchError="Unable to load this booking. Try again in a moment."
      />
    );
  }

  return (
    <BookingDetailWorkspace
      key={id}
      bookingId={id}
      booking={result.data.booking}
      talent={result.data.talent}
      history={result.data.history}
      viewerRole={result.data.viewer_role}
      fetchError={null}
    />
  );
}
