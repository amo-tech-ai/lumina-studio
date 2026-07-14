export type PlannerInstanceStatus =
  | "draft"
  | "planned"
  | "active"
  | "blocked"
  | "completed"
  | "archived"
  | "cancelled";

export type PlannerTaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type PlannerPriority = "low" | "medium" | "high" | "critical";

export type DependencyType =
  | "finish_to_start"
  | "start_to_start"
  | "finish_to_finish"
  | "start_to_finish";

export type PlannerRole = "owner" | "manager" | "contributor" | "viewer";

export type EntityType = "shoot" | "campaign" | "crm_deal";

export type ViewType = "timeline" | "kanban" | "calendar";

export type GateType = "approval" | "review" | "signoff" | null;

export type ConditionType =
  | "all_tasks_done"
  | "role_approval"
  | "dependency_met"
  | "date_reached";

export interface PlannerWorkflow {
  id: string;
  orgId: string;
  name: string;
  category: string;
  version: number;
  schema: Record<string, unknown> | null;
  isDefault: boolean;
  phases: PlannerPhase[];
}

export interface PlannerPhase {
  id: string;
  workflowId: string;
  slug: string;
  name: string;
  orderIndex: number;
  defaultDurationDays: number;
  gateType: GateType;
  requiredRole: string | null;
}

export interface GateCondition {
  id: string;
  phaseId: string;
  conditionType: ConditionType;
  config: Record<string, unknown>;
}

export interface PlannerInstance {
  id: string;
  orgId: string;
  workflowId: string;
  entityType: EntityType;
  entityId: string;
  name: string;
  status: PlannerInstanceStatus;
  plannedStart: string | null;
  plannedEnd: string | null;
  ownerUserId: string | null;
  tasks: PlannerTask[];
}

export interface PlannerTask {
  id: string;
  instanceId: string;
  phaseId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  status: PlannerTaskStatus;
  priority: PlannerPriority;
  assigneeUserId: string | null;
  assigneeRole: string | null;
  sortOrder: number;
}

export interface PlannerDependency {
  id: string;
  instanceId: string;
  fromTaskId: string;
  toTaskId: string;
  depType: DependencyType;
  lagDays: number;
}

export interface PlannerAssignment {
  id: string;
  instanceId: string;
  userId: string;
  role: PlannerRole;
  permissions: Record<string, unknown> | null;
}

export interface PlannerEvent {
  id: string;
  instanceId: string;
  taskId: string | null;
  actorUserId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface PlannerViewConfig {
  id: string;
  userId: string;
  instanceId: string;
  defaultView: ViewType;
  filters: Record<string, unknown>;
  sortConfig: Record<string, unknown>;
}

export interface PlannerNotificationRule {
  id: string;
  orgId: string;
  workflowId: string | null;
  eventType: string;
  targetRole: string | null;
  channel: "in_app" | "email" | "push" | "sms";
  templateRef: string | null;
  delayMinutes: number;
  isActive: boolean;
}

export interface CreateInstanceParams {
  workflowId: string;
  orgId: string;
  entityType: EntityType;
  entityId: string;
  name: string;
  plannedStart: string;
  ownerUserId?: string;
}

export interface BuildScheduleResult {
  tasks: PlannerTask[];
  dependencies: PlannerDependency[];
  warnings: string[];
}

export interface DependencyGraph {
  adjacency: Map<string, string[]>; // taskId -> successor taskIds
  reverseAdjacency: Map<string, string[]>; // taskId -> predecessor taskIds
}

// IPI-536 — shared mutation-result shape for all Planner mutations (IPI-574/575/582).
// `ok` discriminant matches the existing ServiceResult<T> convention in
// app/src/lib/booking/booking-service.ts, not a `success` field.
export interface PlannerMutationError {
  code: string;
  message: string;
}

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PlannerMutationError };
