import type { ActivityEvent } from "@/lib/brand-hub";
import { formatBrandHubDateTime } from "@/lib/brand-hub";

type Props = {
  events: ActivityEvent[];
};

export const ActivityTab = ({ events }: Props) => {
  if (events.length === 0) {
    return (
      <p className="font-sans text-sm text-[#94A3B8]">No activity recorded yet.</p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-[#E8E0D8] pl-6">
      {events.map((event, index) => {
        const atLabel = event.at ? formatBrandHubDateTime(event.at) : null;
        return (
        <li key={event.id} className="relative">
          <span
            className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white"
            style={{
              background: index === events.length - 1 ? "#E87C4D" : "#D1C9C0",
            }}
          />
          <p className="font-sans text-sm font-medium text-[#1E293B]">{event.label}</p>
          {atLabel && (
            <p className="font-sans text-xs text-[#94A3B8]">{atLabel}</p>
          )}
          {event.detail && (
            <p className="mt-1 font-sans text-xs text-[#DC2626]">{event.detail}</p>
          )}
        </li>
        );
      })}
    </ol>
  );
};
