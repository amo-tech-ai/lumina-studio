import { useState } from "react";

import { campaignObjectiveLabel, campaignStatusDot, campaignStatusLabel, deliverableProgress, formatCampaignDates, type CampaignRow, type DeliverableRow } from "@/lib/campaigns";

type Props = {
  campaign: CampaignRow;
  deliverables: DeliverableRow[];
};

export function CampaignCard({ campaign, deliverables }: Props) {
  const dot = campaignStatusDot(campaign.status);
  const label = campaignStatusLabel(campaign.status);
  const dates = formatCampaignDates(campaign.start_date, campaign.end_date);
  const prog = deliverableProgress(deliverables);
  const objective = campaignObjectiveLabel(campaign.objective);
  const [coverError, setCoverError] = useState(false);
  const hasCover = !!campaign.cover_url && !coverError;

  return (
    <div
      data-testid="campaign-card"
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-bg-card)",
        borderRadius: "var(--card-radius, 1.25rem)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-card, 0 1px 3px rgba(17,17,17,.05))",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: "var(--color-bg-muted)",
          position: "relative",
          overflow: "hidden",
        }}
        data-testid={hasCover ? "cover-image" : "cover-fallback"}
      >
        {hasCover ? (
          <img
            src={campaign.cover_url!}
            alt=""
            aria-hidden="true"
            onError={() => setCoverError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.4))",
          }}
        />
        <span
          aria-label={`Status: ${label}`}
          style={{
            position: "absolute",
            left: 11,
            bottom: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            background: "rgba(17,17,17,.5)",
            backdropFilter: "blur(3px)",
            padding: "3px 9px",
            borderRadius: 999,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 50, background: dot }} aria-hidden="true" />
          {label}
        </span>
      </div>
      <div style={{ padding: "14px 15px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={campaign.name}
        >
          {campaign.name}
        </div>
        {objective ? (
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{objective}</div>
        ) : null}
        {dates ? (
          <div
            className="mono"
            style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}
          >
            {dates}
          </div>
        ) : null}
        <div style={{ marginTop: 13 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{prog.label}</span>
            <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {prog.pct}%
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 5, background: "var(--color-bg-muted)", overflow: "hidden" }}>
            <span
              aria-hidden
              style={{
                display: "block",
                height: "100%",
                width: `${prog.pct}%`,
                background: "var(--color-text-primary)",
                borderRadius: 5,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
