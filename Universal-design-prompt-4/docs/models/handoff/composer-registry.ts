/**
 * composer-registry.ts — route → assistant map for the mobile AI Composer.
 *
 * Single source of behavior: MOBILE-PLAN.md §22.3 (routes) + §22.4 (chips).
 * Pure DATA — no React, no side effects. Claude Code imports resolve() to
 * drive the composer's placeholder / chips / agent per route+role.
 *
 * HITL rule (§22.4): chips only carry review · explain · draft · prepare ·
 * summarize · compare · filter · find. NEVER accept/decline/confirm/send/
 * publish/book. A "Prepare…" chip yields a draft the user confirms.
 */

export type AssistantId =
  | 'production' | 'operations' | 'strategy' | 'brand'
  | 'matching' | 'booking' | 'agency' | 'asset'
  | 'commerce' | 'analytics' | 'help';

export type Role = 'operator' | 'model' | 'agency';

export interface AssistantMeta { id: AssistantId; label: string; }

export interface ResolvedComposer {
  assistant: AssistantId;
  label: string;        // "Booking Assistant"
  placeholder: string;  // "Ask Booking Assistant…"
  chips: string[];      // HITL-safe verbs only
  insights: boolean;    // header Insights sheet available?
  inline: boolean;      // wizard variant: inline helper, no tab bar / no expand
}

export const ASSISTANTS: Record<AssistantId, AssistantMeta> = {
  production: { id: 'production', label: 'Production Assistant' },
  operations: { id: 'operations', label: 'Operations Assistant' },
  strategy:   { id: 'strategy',   label: 'Strategy Assistant' },
  brand:      { id: 'brand',      label: 'Brand Assistant' },
  matching:   { id: 'matching',   label: 'Matching Assistant' },
  booking:    { id: 'booking',    label: 'Booking Assistant' },
  agency:     { id: 'agency',     label: 'Agency Assistant' },
  asset:      { id: 'asset',      label: 'Asset Assistant' },
  commerce:   { id: 'commerce',   label: 'Commerce Assistant' },
  analytics:  { id: 'analytics',  label: 'Analytics Assistant' },
  help:       { id: 'help',       label: 'Help Assistant' },
};

/** Proactive chip families — §22.4. HITL-safe verbs only. */
export const CHIPS: Record<string, string[]> = {
  core:      ["Today's priorities", 'What needs action?', 'Summarize', 'Draft an update'],
  brand:     ['Explain the DNA', 'Compare brands', 'Health summary', 'Draft a brief'],
  shoots:    ['Build a call sheet', 'Check the schedule', 'Explain a delay', 'Draft approvals note'],
  booking:   ['Review offers', 'Explain fit', 'Prepare booking', 'Check availability'],
  commerce:  ['Find similar assets', 'Check rights', 'Explain usage', 'Draft caption'],
  analytics: ['Explain this metric', 'Compare periods', 'Draft a report', 'What changed?'],
  help:      ['How do I…?', 'Explain this screen', 'Contact support'],
};

interface RouteEntry {
  match: RegExp;
  assistant: AssistantId | ((role?: Role) => AssistantId);
  placeholder: string | ((role?: Role) => string);
  chips: keyof typeof CHIPS;
  insights?: boolean; // default true
  inline?: boolean;   // wizard exception (§22.2)
}

/** Ordered most-specific → least. First match wins. Mirrors §22.3 exactly. */
const ROUTES: RouteEntry[] = [
  // Core
  { match: /^\/app$/,            assistant: 'production', placeholder: 'Ask Production Assistant…', chips: 'core' },
  { match: /^\/app\/home$/,      assistant: 'operations', placeholder: 'Ask Operations Assistant…', chips: 'core' },
  { match: /^\/app\/brief$/,     assistant: 'strategy',   placeholder: 'Ask Strategy Assistant…',   chips: 'core' },
  { match: /^\/app\/inbox$/,     assistant: 'operations', placeholder: 'Ask about your notifications…', chips: 'core' },
  { match: /^\/app\/messages$/,  assistant: 'operations', placeholder: 'Ask about your messages…',  chips: 'core' },
  { match: /^\/app\/settings$/,  assistant: 'help',       placeholder: 'Ask for help…',             chips: 'help', insights: false },
  { match: /^\/app\/profile$/,   assistant: 'operations', placeholder: 'Ask about your account…',   chips: 'core' },
  // Brand
  { match: /^\/app\/brands$/,          assistant: 'brand', placeholder: 'Ask Brand Assistant…',   chips: 'brand' },
  { match: /^\/app\/brand\/[^/]+\/dna$/,    assistant: 'brand', placeholder: 'Ask about the DNA…',     chips: 'brand' },
  { match: /^\/app\/brand\/[^/]+\/health$/, assistant: 'brand', placeholder: 'Ask about brand health…',chips: 'brand' },
  { match: /^\/app\/brand\/[^/]+\/intel$/,  assistant: 'brand', placeholder: 'Ask Brand Assistant…',   chips: 'brand' },
  { match: /^\/app\/brand\/[^/]+$/,         assistant: 'brand', placeholder: 'Ask about this brand…',   chips: 'brand' },
  // Shoots
  { match: /^\/app\/shoots$/,                assistant: 'production', placeholder: 'Ask Production Assistant…', chips: 'shoots' },
  { match: /^\/app\/shoots\/new$/,           assistant: 'production', placeholder: 'Ask Production Assistant…', chips: 'shoots', insights: false, inline: true },
  { match: /^\/app\/shoots\/[^/]+\/callsheet$/,    assistant: 'production', placeholder: 'Ask about the call sheet…', chips: 'shoots' },
  { match: /^\/app\/shoots\/[^/]+\/schedule$/,     assistant: 'production', placeholder: 'Ask about the schedule…',  chips: 'shoots' },
  { match: /^\/app\/shoots\/[^/]+\/deliverables$/, assistant: 'production', placeholder: 'Ask about deliverables…',  chips: 'shoots' },
  { match: /^\/app\/shoots\/[^/]+\/approvals$/,    assistant: 'production', placeholder: 'Ask about approvals…',     chips: 'shoots' },
  { match: /^\/app\/shoots\/[^/]+$/,               assistant: 'production', placeholder: 'Ask about this shoot…',    chips: 'shoots' },
  // Booking
  { match: /^\/app\/matching$/, assistant: 'matching', placeholder: 'Ask Matching Assistant…', chips: 'booking' },
  {
    match: /^\/app\/talent\/[^/]+$/,
    assistant: (role) => (role === 'model' ? 'booking' : 'matching'),
    placeholder: (role) => (role === 'model' ? 'Ask Booking Assistant…' : 'Ask about @handle…'),
    chips: 'booking',
  },
  { match: /^\/app\/booking\/[^/]+\/wizard$/, assistant: 'booking', placeholder: 'Ask Booking Assistant…', chips: 'booking', insights: false, inline: true },
  { match: /^\/app\/booking\/[^/]+$/,         assistant: 'booking', placeholder: 'Ask about this booking…', chips: 'booking' },
  {
    match: /^\/app\/dashboard$/,
    assistant: (role) => (role === 'agency' ? 'agency' : 'booking'),
    placeholder: (role) => (role === 'agency' ? 'Ask Agency Assistant…' : 'Ask Booking Assistant…'),
    chips: 'booking',
  },
  { match: /^\/app\/availability$/, assistant: 'booking', placeholder: 'Ask about your availability…', chips: 'booking' },
  // Commerce
  { match: /^\/app\/assets$/,          assistant: 'asset',    placeholder: 'Ask Asset Assistant…',    chips: 'commerce' },
  { match: /^\/app\/assets\/[^/]+$/,   assistant: 'asset',    placeholder: 'Ask about this asset…',    chips: 'commerce' },
  { match: /^\/app\/library$/,         assistant: 'asset',    placeholder: 'Ask Asset Assistant…',    chips: 'commerce' },
  { match: /^\/app\/deliverables$/,    assistant: 'production', placeholder: 'Ask about deliverables…', chips: 'shoots' },
  { match: /^\/app\/preview$/,         assistant: 'commerce', placeholder: 'Ask Commerce Assistant…',  chips: 'commerce' },
  { match: /^\/app\/campaigns\/[^/]+$/,assistant: 'commerce', placeholder: 'Ask about this campaign…', chips: 'commerce' },
  // Analytics
  { match: /^\/app\/analytics$/,             assistant: 'analytics', placeholder: 'Ask Analytics Assistant…', chips: 'analytics' },
  { match: /^\/app\/analytics\/reports$/,     assistant: 'analytics', placeholder: 'Ask about this report…',   chips: 'analytics' },
  { match: /^\/app\/analytics\/kpis$/,        assistant: 'analytics', placeholder: 'Ask about these KPIs…',    chips: 'analytics' },
  { match: /^\/app\/analytics\/performance$/, assistant: 'analytics', placeholder: 'Ask about performance…',   chips: 'analytics' },
  { match: /^\/app\/analytics\/revenue$/,     assistant: 'analytics', placeholder: 'Ask about revenue…',       chips: 'analytics' },
  { match: /^\/app\/analytics\/utilization$/, assistant: 'analytics', placeholder: 'Ask about utilization…',   chips: 'analytics' },
];

/** Fallback when no route matches — safe, read-only Help. */
const FALLBACK: ResolvedComposer = {
  assistant: 'help', label: ASSISTANTS.help.label,
  placeholder: 'Ask for help…', chips: CHIPS.help,
  insights: false, inline: false,
};

/**
 * Resolve the composer config for a route + role.
 * @param route  current pathname (e.g. "/app/talent/nova")
 * @param role   'operator' | 'model' | 'agency'
 */
export function resolve(route: string, role?: Role): ResolvedComposer {
  const entry = ROUTES.find((r) => r.match.test(route));
  if (!entry) return FALLBACK;
  const assistant = typeof entry.assistant === 'function' ? entry.assistant(role) : entry.assistant;
  const placeholder = typeof entry.placeholder === 'function' ? entry.placeholder(role) : entry.placeholder;
  return {
    assistant,
    label: ASSISTANTS[assistant].label,
    placeholder,
    chips: CHIPS[entry.chips],
    insights: entry.insights !== false,
    inline: entry.inline === true,
  };
}
