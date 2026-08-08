/**
 * AGENT-PLAN-001 — build shot lists from lookupShotReferences rows only.
 * Shared by generateShotListDraft and the shoot-wizard Mastra workflow.
 */

export type ReferenceShotType = {
  id: string;
  angle: string;
  description: string;
  channel_fit: string[];
  background?: string | null;
};

export type ApprovedDeliverable = {
  id?: string;
  channel: string;
  format?: string;
  quantity: number;
};

export type BuiltShot = {
  shot_number: number;
  description: string;
  angle: string;
  lighting: string;
  deliverable_ids: string[];
  notes?: string;
  reference_id: string;
};

/** Wizard channel ids → shot_type_references.channel_fit values */
export function toReferenceChannel(channel: string): string {
  return channel === "shopify" ? "shopify_pdp" : channel;
}

export function channelMatchesReference(deliverableChannel: string, channelFit: string[]): boolean {
  const refChannel = toReferenceChannel(deliverableChannel);
  return channelFit.includes(deliverableChannel) || channelFit.includes(refChannel);
}

function lightingFromBackground(background: string | null | undefined): string {
  if (!background) return "studio strobe";
  if (background === "white") return "even studio light";
  if (background === "lifestyle") return "natural window light";
  if (background === "custom_backdrop") return "styled key light";
  if (background === "studio_gradient") return "studio strobe with gradient";
  return "studio strobe";
}

export function pickReferencesForDeliverable(
  deliverableChannel: string,
  references: ReferenceShotType[],
  count: number,
): ReferenceShotType[] {
  const matching = references.filter((r) => channelMatchesReference(deliverableChannel, r.channel_fit));
  if (!matching.length) return [];
  const picked: ReferenceShotType[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(matching[i % matching.length]);
  }
  return picked;
}

export function buildShotListFromReferences(
  approvedDeliverables: ApprovedDeliverable[],
  referenceShotTypes: ReferenceShotType[],
  productNames: string[] = [],
): { shots: BuiltShot[]; uncovered_deliverable_warnings: string[] } {
  if (!referenceShotTypes.length) {
    throw new Error(
    "reference_shot_types is empty — call lookupShotReferences before buildShotListFromReferences",
    );
  }

  const allowedReferenceIds = new Set(referenceShotTypes.map((r) => r.id));
  let shotCounter = 0;
  const shots: BuiltShot[] = [];

  for (let di = 0; di < approvedDeliverables.length; di++) {
    const deliverable = approvedDeliverables[di];
    const deliverableId = deliverable.id ?? `deliverable-${di}`;
    const shotCount = Math.max(1, Math.ceil(deliverable.quantity / 3));
    const refs = pickReferencesForDeliverable(deliverable.channel, referenceShotTypes, shotCount);

    for (const ref of refs) {
      if (!allowedReferenceIds.has(ref.id)) {
        throw new Error(`Invented reference_id "${ref.id}" — references must come from lookupShotReferences`);
      }
      shots.push({
        shot_number: ++shotCounter,
        description: `${deliverable.channel} ${deliverable.format ?? ""} — ${ref.description}`.trim(),
        angle: ref.angle,
        lighting: lightingFromBackground(ref.background),
        deliverable_ids: [deliverableId],
        reference_id: ref.id,
        notes: productNames[0] ? `Product: ${productNames[0]}` : undefined,
      });
    }
  }

  const coveredIds = new Set(shots.flatMap((s) => s.deliverable_ids));
  const uncovered = approvedDeliverables
    .filter((d, i) => !coveredIds.has(d.id ?? `deliverable-${i}`))
    .map((d) => `Deliverable ${d.channel}/${d.format ?? ""} has no shots`);

  return { shots, uncovered_deliverable_warnings: uncovered };
}
