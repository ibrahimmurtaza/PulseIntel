export type User = {
  id: string;
  name: string;
  email: string;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
};

export type Workspace = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
};

export type TenantRole = "owner" | "admin" | "member";
export type WorkspaceRole = "viewer" | "editor" | "admin";

export type TenantHomeWorkspace = {
  id: string;
  name: string;
  description: string;
  role: WorkspaceRole;
};

export type TenantMembership = {
  tenantId: string;
  userId: string;
  role: TenantRole;
};

export type WorkspaceMembership = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

export type InvitationStatus = "pending" | "accepted";

export type Invitation = {
  id: string;
  tenantId: string;
  email: string;
  invitedName?: string;
  tenantRole: TenantRole;
  workspaceId?: string;
  workspaceRole?: WorkspaceRole;
  invitedByUserId: string;
  acceptedByUserId?: string;
  status: InvitationStatus;
};

export type InvitationInput = {
  email: string;
  invitedName?: string;
  tenantRole: TenantRole;
  workspaceId?: string;
  workspaceRole?: WorkspaceRole;
};

export type InvitationView = {
  id: string;
  tenantSlug: string;
  tenantName: string;
  email: string;
  invitedName?: string;
  tenantRole: TenantRole;
  workspace?: {
    id: string;
    name: string;
  };
  workspaceRole?: WorkspaceRole;
  status: InvitationStatus;
  acceptPath: string;
};

export type WorkspaceView = {
  id: string;
  tenantSlug: string;
  name: string;
  description: string;
  memberCount: number;
  canManage: boolean;
};

export type WorkspaceDetailView = WorkspaceView & {
  tenant: Tenant;
  role: WorkspaceRole;
};

export type WidgetKind = "chart" | "feed" | "metric" | "insight";

export type DashboardTimeRange = {
  label: string;
  windowDays: number;
};

export type Widget = {
  id: string;
  dashboardId: string;
  kind: WidgetKind;
  title: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  timeRangeOverride?: DashboardTimeRange;
};

export type Dashboard = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  defaultTimeRange: DashboardTimeRange;
  createdByUserId: string;
  createdAt: string;
};

export type WidgetView = Widget;

export type DashboardView = {
  id: string;
  workspaceId: string;
  tenantSlug: string;
  name: string;
  description: string;
  defaultTimeRange: DashboardTimeRange;
  widgetCount: number;
  canManage: boolean;
  createdAt: string;
};

export type DashboardDetailView = DashboardView & {
  tenant: Tenant;
  role: WorkspaceRole;
  widgets: WidgetView[];
};

export type DashboardRevisionState = {
  dashboard: Dashboard;
  widgets: Widget[];
};

export type DashboardRevision = {
  id: string;
  dashboardId: string;
  workspaceId: string;
  isSnapshot: boolean;
  label: string;
  createdByUserId: string;
  createdAt: string;
  state: DashboardRevisionState;
};

export type DashboardRevisionView = {
  id: string;
  dashboardId: string;
  workspaceId: string;
  tenantSlug: string;
  isSnapshot: boolean;
  label: string;
  createdBy: { id: string; name: string };
  createdAt: string;
  widgetCount: number;
};

export type SourceKind = "rss" | "manual";

export type RssSourceConfig = {
  feedUrl: string;
};

export type ManualSourceConfig = {
  description?: string;
};

export type SourceConfig = RssSourceConfig | ManualSourceConfig;

export type Source = {
  id: string;
  tenantId: string;
  name: string;
  kind: SourceKind;
  config: SourceConfig;
  createdByUserId: string;
  createdAt: string;
};

export type SourceView = {
  id: string;
  tenantSlug: string;
  name: string;
  kind: SourceKind;
  feedUrl: string;
  description: string;
  createdAt: string;
  canManage: boolean;
  health: SourceHealthStatus;
};

export type SubscriptionFilter = {
  keywords: string[];
};

export type SourceSubscription = {
  id: string;
  tenantId: string;
  workspaceId: string;
  sourceId: string;
  filter: SubscriptionFilter;
  subscribedByUserId: string;
  createdAt: string;
};

export type SourceSubscriptionView = {
  id: string;
  tenantSlug: string;
  workspaceId: string;
  workspaceName: string;
  sourceId: string;
  sourceName: string;
  feedUrl: string;
  filter: SubscriptionFilter;
  createdAt: string;
};

export type ArticleIdentity = {
  url: string;
};

export type ObservationEvidence = {
  url: string;
  snapshotAt: string;
};

export type Observation = {
  id: string;
  tenantId: string;
  sourceId: string;
  articleIdentity: ArticleIdentity;
  title: string;
  publishedAt: string;
  collectedAt: string;
  citationNote?: string;
  evidence: ObservationEvidence[];
};

export type ObservationView = {
  id: string;
  tenantSlug: string;
  sourceId: string;
  sourceName: string;
  sourceKind: SourceKind;
  articleUrl: string;
  title: string;
  publishedAt: string;
  collectedAt: string;
  evidenceCount: number;
  citationNote?: string;
};

export type ManualObservationInput = {
  title: string;
  publishedAt: string;
  citationNote: string;
  articleUrl?: string;
};

export type RssFeedItemInput = {
  url: string;
  title: string;
  publishedAt: string;
};

export type RssCollectionResult = {
  created: Observation[];
  duplicateCount: number;
  observations: ObservationView[];
  run: CollectionRunView;
};

export type CollectionRunOutcome = "success" | "failure";

export type CollectionRun = {
  id: string;
  tenantId: string;
  sourceId: string;
  outcome: CollectionRunOutcome;
  itemsCollected: number;
  duplicatesSkipped: number;
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
};

export type CollectionRunView = {
  id: string;
  tenantSlug: string;
  sourceId: string;
  sourceName: string;
  outcome: CollectionRunOutcome;
  itemsCollected: number;
  duplicatesSkipped: number;
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
};

export type SourceHealthStatus = "healthy" | "degraded" | "failing" | "unknown";

export type SourceHealthView = {
  sourceId: string;
  tenantSlug: string;
  status: SourceHealthStatus;
  lastRunAt?: string;
  lastSuccessAt?: string;
  recentFailureCount: number;
  totalRuns: number;
};

const initialUsers: User[] = [
  {
    id: "usr_anna",
    name: "Anna Analyst",
    email: "anna@acme.test",
  },
  {
    id: "usr_maya",
    name: "Maya Market Lead",
    email: "maya@acme.test",
  },
  {
    id: "usr_liam",
    name: "Liam External",
    email: "liam@globex.test",
  },
];

const tenants: Tenant[] = [
  {
    id: "tenant_acme",
    slug: "acme",
    name: "Acme Intelligence",
  },
  {
    id: "tenant_globex",
    slug: "globex",
    name: "Globex Advisory",
  },
];

const initialTenantMemberships: TenantMembership[] = [
  { tenantId: "tenant_acme", userId: "usr_anna", role: "member" },
  { tenantId: "tenant_acme", userId: "usr_maya", role: "admin" },
  { tenantId: "tenant_globex", userId: "usr_liam", role: "admin" },
];

const workspaces: Workspace[] = [
  {
    id: "ws_launch",
    tenantId: "tenant_acme",
    name: "Launch Monitoring",
    description: "Signals for the upcoming product launch.",
  },
  {
    id: "ws_pricing",
    tenantId: "tenant_acme",
    name: "Pricing Watch",
    description: "Competitor pricing and promotion tracking.",
  },
  {
    id: "ws_strategy",
    tenantId: "tenant_acme",
    name: "Strategy Room",
    description: "Leadership-only synthesis and planning.",
  },
  {
    id: "ws_globex_core",
    tenantId: "tenant_globex",
    name: "Globex Core",
    description: "Primary workspace for Globex.",
  },
];

const initialWorkspaceMemberships: WorkspaceMembership[] = [
  { workspaceId: "ws_launch", userId: "usr_anna", role: "editor" },
  { workspaceId: "ws_pricing", userId: "usr_anna", role: "viewer" },
  { workspaceId: "ws_launch", userId: "usr_maya", role: "admin" },
  { workspaceId: "ws_pricing", userId: "usr_maya", role: "admin" },
  { workspaceId: "ws_strategy", userId: "usr_maya", role: "admin" },
  { workspaceId: "ws_globex_core", userId: "usr_liam", role: "admin" },
];

let nextUserId = 1;
let nextInvitationId = 1;
let nextWorkspaceId = 1;
let nextDashboardId = 1;
let nextWidgetId = 1;
let nextRevisionId = 1;
let nextSourceId = 1;
let nextSubscriptionId = 1;
let nextObservationId = 1;
let nextCollectionRunId = 1;

let users = cloneUsers(initialUsers);
let tenantMemberships = cloneTenantMemberships(initialTenantMemberships);
let workspaceMemberships = cloneWorkspaceMemberships(initialWorkspaceMemberships);
let invitations: Invitation[] = [];
let dashboards: Dashboard[] = [];
let widgets: Widget[] = [];
let revisions: DashboardRevision[] = [];
let sources: Source[] = [];
let subscriptions: SourceSubscription[] = [];
let observations: Observation[] = [];
let collectionRuns: CollectionRun[] = [];

function cloneUsers(entries: User[]): User[] {
  return entries.map((entry) => ({ ...entry }));
}

function cloneTenantMemberships(
  entries: TenantMembership[],
): TenantMembership[] {
  return entries.map((entry) => ({ ...entry }));
}

function cloneWorkspaceMemberships(
  entries: WorkspaceMembership[],
): WorkspaceMembership[] {
  return entries.map((entry) => ({ ...entry }));
}

function cloneInvitation(entry: Invitation): Invitation {
  return { ...entry };
}

function cloneDashboardRecord(entry: Dashboard): Dashboard {
  return {
    ...entry,
    defaultTimeRange: { ...entry.defaultTimeRange },
  };
}

function cloneWidget(entry: Widget): Widget {
  return {
    ...entry,
    timeRangeOverride: entry.timeRangeOverride
      ? { ...entry.timeRangeOverride }
      : undefined,
  };
}

function createUserId(): string {
  const value = nextUserId;
  nextUserId += 1;
  return `usr_invited_${value}`;
}

function createInvitationId(): string {
  const value = nextInvitationId;
  nextInvitationId += 1;
  return `inv_${value}`;
}

function createWorkspaceId(): string {
  const value = nextWorkspaceId;
  nextWorkspaceId += 1;
  return `ws_${value}`;
}

function createDashboardId(): string {
  const value = nextDashboardId;
  nextDashboardId += 1;
  return `dash_${value}`;
}

function createWidgetId(): string {
  const value = nextWidgetId;
  nextWidgetId += 1;
  return `wgt_${value}`;
}

function createRevisionId(): string {
  const value = nextRevisionId;
  nextRevisionId += 1;
  return `rev_${value}`;
}

function createSourceId(): string {
  const value = nextSourceId;
  nextSourceId += 1;
  return `src_${value}`;
}

function createSubscriptionId(): string {
  const value = nextSubscriptionId;
  nextSubscriptionId += 1;
  return `sub_${value}`;
}

function createObservationId(): string {
  const value = nextObservationId;
  nextObservationId += 1;
  return `obs_${value}`;
}

function createCollectionRunId(): string {
  const value = nextCollectionRunId;
  nextCollectionRunId += 1;
  return `run_${value}`;
}

function cloneRevisionState(state: DashboardRevisionState): DashboardRevisionState {
  return {
    dashboard: cloneDashboardRecord(state.dashboard),
    widgets: state.widgets.map(cloneWidget),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getTenantById(tenantId: string): Tenant | undefined {
  return tenants.find((tenant) => tenant.id === tenantId);
}

function getWorkspaceById(workspaceId: string): Workspace | undefined {
  return workspaces.find((workspace) => workspace.id === workspaceId);
}

function getInvitationRecord(invitationId: string): Invitation | undefined {
  return invitations.find((invitation) => invitation.id === invitationId);
}

function getDashboardRecord(dashboardId: string): Dashboard | undefined {
  return dashboards.find((dashboard) => dashboard.id === dashboardId);
}

function getWidgetRecord(widgetId: string): Widget | undefined {
  return widgets.find((widget) => widget.id === widgetId);
}

function getRevisionRecord(revisionId: string): DashboardRevision | undefined {
  return revisions.find((revision) => revision.id === revisionId);
}

function getSourceRecord(sourceId: string): Source | undefined {
  return sources.find((source) => source.id === sourceId);
}

function getSubscriptionRecord(
  subscriptionId: string,
): SourceSubscription | undefined {
  return subscriptions.find(
    (subscription) => subscription.id === subscriptionId,
  );
}

function getObservationRecord(
  observationId: string,
): Observation | undefined {
  return observations.find((observation) => observation.id === observationId);
}

function invitationToView(invitation: Invitation): InvitationView {
  const tenant = getTenantById(invitation.tenantId);
  const workspace = invitation.workspaceId
    ? getWorkspaceById(invitation.workspaceId)
    : undefined;

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  return {
    id: invitation.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    email: invitation.email,
    invitedName: invitation.invitedName,
    tenantRole: invitation.tenantRole,
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
        }
      : undefined,
    workspaceRole: invitation.workspaceRole,
    status: invitation.status,
    acceptPath: `/invitations/${invitation.id}`,
  };
}

export function listDemoUsers(): User[] {
  return cloneUsers(users);
}

export function getUserById(userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}

export function getUserByEmail(email: string): User | undefined {
  const normalizedEmail = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail);
}

export function getOrCreateUserByEmail(
  email: string,
  invitedName?: string,
): User {
  const existingUser = getUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const user: User = {
    id: createUserId(),
    name: invitedName?.trim() || normalizeEmail(email),
    email: normalizeEmail(email),
  };

  users.push(user);
  return user;
}

export function getTenantBySlug(tenantSlug: string): Tenant | undefined {
  return tenants.find((entry) => entry.slug === tenantSlug);
}

export function listTenantWorkspaces(tenantSlug: string): Workspace[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  return workspaces.filter((workspace) => workspace.tenantId === tenant.id);
}

export function getTenantMembership(
  tenantSlug: string,
  userId: string,
): TenantMembership | undefined {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return undefined;
  }

  return tenantMemberships.find(
    (membership) =>
      membership.tenantId === tenant.id && membership.userId === userId,
  );
}

export function canManageTenantInvitations(
  tenantSlug: string,
  userId: string,
): boolean {
  const membership = getTenantMembership(tenantSlug, userId);
  return membership?.role === "admin" || membership?.role === "owner";
}

export function listTenantInvitations(tenantSlug: string): InvitationView[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  return invitations
    .filter((invitation) => invitation.tenantId === tenant.id)
    .map(invitationToView);
}

export function getInvitationById(
  invitationId: string,
): InvitationView | undefined {
  const invitation = getInvitationRecord(invitationId);
  return invitation ? invitationToView(invitation) : undefined;
}

export function createInvitation(input: {
  tenantSlug: string;
  invitedByUserId: string;
  email: string;
  invitedName?: string;
  tenantRole: TenantRole;
  workspaceId?: string;
  workspaceRole?: WorkspaceRole;
}): InvitationView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  if (!canManageTenantInvitations(input.tenantSlug, input.invitedByUserId)) {
    throw new Error("forbidden");
  }

  if (input.workspaceId && !input.workspaceRole) {
    throw new Error("workspace_role_required");
  }

  if (!input.workspaceId && input.workspaceRole) {
    throw new Error("workspace_id_required");
  }

  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail) {
    throw new Error("email_required");
  }

  if (input.workspaceId) {
    const workspace = getWorkspaceById(input.workspaceId);

    if (!workspace || workspace.tenantId !== tenant.id) {
      throw new Error("workspace_not_found");
    }
  }

  const invitation: Invitation = {
    id: createInvitationId(),
    tenantId: tenant.id,
    email: normalizedEmail,
    invitedName: input.invitedName?.trim() || undefined,
    tenantRole: input.tenantRole,
    workspaceId: input.workspaceId,
    workspaceRole: input.workspaceRole,
    invitedByUserId: input.invitedByUserId,
    status: "pending",
  };

  invitations.unshift(invitation);

  return invitationToView(invitation);
}

export function acceptInvitation(input: {
  invitationId: string;
  userId?: string;
  userEmail?: string;
  invitedName?: string;
}): { invitation: InvitationView; user: User; tenantSlug: string } {
  const invitation = getInvitationRecord(input.invitationId);

  if (!invitation) {
    throw new Error("invitation_not_found");
  }

  if (invitation.status !== "pending") {
    throw new Error("invitation_not_pending");
  }

  let user: User;

  if (input.userId) {
    const existingUser = getUserById(input.userId);

    if (!existingUser) {
      throw new Error("user_not_found");
    }

    if (normalizeEmail(existingUser.email) !== invitation.email) {
      throw new Error("invitation_email_mismatch");
    }

    user = existingUser;
  } else if (input.userEmail) {
    if (normalizeEmail(input.userEmail) !== invitation.email) {
      throw new Error("invitation_email_mismatch");
    }

    user = getOrCreateUserByEmail(input.userEmail, input.invitedName);
  } else {
    user = getOrCreateUserByEmail(invitation.email, invitation.invitedName);
  }

  const tenantMembership = tenantMemberships.find(
    (membership) =>
      membership.tenantId === invitation.tenantId &&
      membership.userId === user.id,
  );

  if (!tenantMembership) {
    tenantMemberships.push({
      tenantId: invitation.tenantId,
      userId: user.id,
      role: invitation.tenantRole,
    });
  } else {
    tenantMembership.role = invitation.tenantRole;
  }

  if (invitation.workspaceId && invitation.workspaceRole) {
    const workspaceMembership = workspaceMemberships.find(
      (membership) =>
        membership.workspaceId === invitation.workspaceId &&
        membership.userId === user.id,
    );

    if (!workspaceMembership) {
      workspaceMemberships.push({
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.workspaceRole,
      });
    } else {
      workspaceMembership.role = invitation.workspaceRole;
    }
  }

  invitation.status = "accepted";
  invitation.acceptedByUserId = user.id;

  const tenant = getTenantById(invitation.tenantId);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  return {
    invitation: invitationToView(invitation),
    user,
    tenantSlug: tenant.slug,
  };
}

export function resetDemoTenantState() {
  users = cloneUsers(initialUsers);
  tenantMemberships = cloneTenantMemberships(initialTenantMemberships);
  workspaceMemberships = cloneWorkspaceMemberships(initialWorkspaceMemberships);
  invitations = [];
  dashboards = [];
  widgets = [];
  revisions = [];
  sources = [];
  subscriptions = [];
  observations = [];
  collectionRuns = [];
  nextUserId = 1;
  nextInvitationId = 1;
  nextWorkspaceId = 1;
  nextDashboardId = 1;
  nextWidgetId = 1;
  nextRevisionId = 1;
  nextSourceId = 1;
  nextSubscriptionId = 1;
  nextObservationId = 1;
  nextCollectionRunId = 1;
}

export function resolveTenantHome(
  tenantSlug: string,
  userId: string,
): { tenant: Tenant; tenantRole: TenantRole; workspaces: TenantHomeWorkspace[] } | null {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const tenantMembership = tenantMemberships.find(
    (membership) =>
      membership.tenantId === tenant.id && membership.userId === userId,
  );

  if (!tenantMembership) {
    return null;
  }

  const accessibleWorkspaces = workspaceMemberships
    .filter((membership) => membership.userId === userId)
    .map((membership) => {
      const workspace = workspaces.find(
        (entry) =>
          entry.id === membership.workspaceId && entry.tenantId === tenant.id,
      );

      if (!workspace) {
        return null;
      }

      return {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        role: membership.role,
      };
    })
    .filter((workspace): workspace is TenantHomeWorkspace => workspace !== null);

  return {
    tenant,
    tenantRole: tenantMembership.role,
    workspaces: accessibleWorkspaces,
  };
}

export function getWorkspaceMembership(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): WorkspaceMembership | undefined {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return undefined;
  }

  const workspace = getWorkspaceById(workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return undefined;
  }

  return workspaceMemberships.find(
    (membership) =>
      membership.workspaceId === workspaceId && membership.userId === userId,
  );
}

export function canManageTenantWorkspaces(
  tenantSlug: string,
  userId: string,
): boolean {
  return canManageTenantInvitations(tenantSlug, userId);
}

export function listTenantWorkspacesForUser(
  tenantSlug: string,
  userId: string,
): WorkspaceView[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  const tenantCanManage = canManageTenantWorkspaces(tenantSlug, userId);
  const userTenantMembership = getTenantMembership(tenantSlug, userId);

  if (!userTenantMembership) {
    return [];
  }

  return workspaces
    .filter((workspace) => workspace.tenantId === tenant.id)
    .filter((workspace) => {
      if (tenantCanManage) {
        return true;
      }

      return workspaceMemberships.some(
        (entry) =>
          entry.workspaceId === workspace.id && entry.userId === userId,
      );
    })
    .map((workspace) => {
      const membership = workspaceMemberships.find(
        (entry) =>
          entry.workspaceId === workspace.id && entry.userId === userId,
      );
      const memberCount = workspaceMemberships.filter(
        (entry) => entry.workspaceId === workspace.id,
      ).length;

      return {
        id: workspace.id,
        tenantSlug: tenant.slug,
        name: workspace.name,
        description: workspace.description,
        memberCount,
        canManage: tenantCanManage || membership?.role === "admin",
      };
    });
}

export function createWorkspace(input: {
  tenantSlug: string;
  createdByUserId: string;
  name: string;
  description?: string;
}): WorkspaceView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  if (!canManageTenantWorkspaces(input.tenantSlug, input.createdByUserId)) {
    throw new Error("forbidden");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("name_required");
  }

  if (
    workspaces.some(
      (workspace) =>
        workspace.tenantId === tenant.id &&
        workspace.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new Error("workspace_already_exists");
  }

  const description = input.description?.trim() ?? "";

  const workspace: Workspace = {
    id: createWorkspaceId(),
    tenantId: tenant.id,
    name,
    description,
  };

  workspaces.push(workspace);

  workspaceMemberships.push({
    workspaceId: workspace.id,
    userId: input.createdByUserId,
    role: "admin",
  });

  return {
    id: workspace.id,
    tenantSlug: tenant.slug,
    name: workspace.name,
    description: workspace.description,
    memberCount: 1,
    canManage: true,
  };
}

export function resolveWorkspace(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): WorkspaceDetailView | null {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const workspace = getWorkspaceById(workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return null;
  }

  const membership = workspaceMemberships.find(
    (entry) =>
      entry.workspaceId === workspaceId && entry.userId === userId,
  );

  if (!membership) {
    return null;
  }

  const memberCount = workspaceMemberships.filter(
    (entry) => entry.workspaceId === workspaceId,
  ).length;

  return {
    id: workspace.id,
    tenantSlug: tenant.slug,
    name: workspace.name,
    description: workspace.description,
    memberCount,
    canManage: membership.role === "admin",
    tenant,
    role: membership.role,
  };
}

function normalizeTimeRangeLabel(label: string): string {
  return label.trim();
}

function isWidgetKind(value: unknown): value is WidgetKind {
  return (
    value === "chart" ||
    value === "feed" ||
    value === "metric" ||
    value === "insight"
  );
}

function parseTimeRangeInput(value: unknown): DashboardTimeRange | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as {
    label?: unknown;
    windowDays?: unknown;
  };

  if (
    typeof candidate.label !== "string" ||
    typeof candidate.windowDays !== "number" ||
    !Number.isFinite(candidate.windowDays) ||
    candidate.windowDays <= 0
  ) {
    return undefined;
  }

  const label = normalizeTimeRangeLabel(candidate.label);

  if (!label) {
    return undefined;
  }

  return { label, windowDays: Math.floor(candidate.windowDays) };
}

export function canManageWorkspaceDashboards(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): boolean {
  const membership = getWorkspaceMembership(tenantSlug, workspaceId, userId);
  return membership?.role === "admin" || membership?.role === "editor";
}

export function listWorkspaceDashboards(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): DashboardView[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  const workspace = getWorkspaceById(workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return [];
  }

  const membership = workspaceMemberships.find(
    (entry) =>
      entry.workspaceId === workspaceId && entry.userId === userId,
  );

  if (!membership) {
    return [];
  }

  const canManage = membership.role === "admin" || membership.role === "editor";

  return dashboards
    .filter((dashboard) => dashboard.workspaceId === workspaceId)
    .map((dashboard) => ({
      id: dashboard.id,
      workspaceId: dashboard.workspaceId,
      tenantSlug: tenant.slug,
      name: dashboard.name,
      description: dashboard.description,
      defaultTimeRange: { ...dashboard.defaultTimeRange },
      widgetCount: widgets.filter((widget) => widget.dashboardId === dashboard.id)
        .length,
      canManage,
      createdAt: dashboard.createdAt,
    }));
}

export function createDashboard(input: {
  tenantSlug: string;
  workspaceId: string;
  createdByUserId: string;
  name: string;
  description?: string;
  defaultTimeRange: DashboardTimeRange;
}): DashboardView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    throw new Error("workspace_not_found");
  }

  if (
    !canManageWorkspaceDashboards(
      input.tenantSlug,
      input.workspaceId,
      input.createdByUserId,
    )
  ) {
    throw new Error("forbidden");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("name_required");
  }

  if (
    dashboards.some(
      (dashboard) =>
        dashboard.workspaceId === input.workspaceId &&
        dashboard.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new Error("dashboard_already_exists");
  }

  const timeRange = parseTimeRangeInput(input.defaultTimeRange);

  if (!timeRange) {
    throw new Error("time_range_required");
  }

  const description = input.description?.trim() ?? "";

  const dashboard: Dashboard = {
    id: createDashboardId(),
    workspaceId: input.workspaceId,
    name,
    description,
    defaultTimeRange: timeRange,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  };

  dashboards.unshift(dashboard);

  return {
    id: dashboard.id,
    workspaceId: dashboard.workspaceId,
    tenantSlug: tenant.slug,
    name: dashboard.name,
    description: dashboard.description,
    defaultTimeRange: { ...dashboard.defaultTimeRange },
    widgetCount: 0,
    canManage: true,
    createdAt: dashboard.createdAt,
  };
}

export function resolveDashboard(
  tenantSlug: string,
  workspaceId: string,
  dashboardId: string,
  userId: string,
): DashboardDetailView | null {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const workspace = getWorkspaceById(workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return null;
  }

  const dashboard = getDashboardRecord(dashboardId);

  if (!dashboard || dashboard.workspaceId !== workspace.id) {
    return null;
  }

  const membership = workspaceMemberships.find(
    (entry) =>
      entry.workspaceId === workspaceId && entry.userId === userId,
  );

  if (!membership) {
    return null;
  }

  const canManage = membership.role === "admin" || membership.role === "editor";
  const dashboardWidgets = widgets
    .filter((widget) => widget.dashboardId === dashboard.id)
    .map((widget) => ({
      ...widget,
      timeRangeOverride: widget.timeRangeOverride
        ? { ...widget.timeRangeOverride }
        : undefined,
    }));

  return {
    id: dashboard.id,
    workspaceId: dashboard.workspaceId,
    tenantSlug: tenant.slug,
    name: dashboard.name,
    description: dashboard.description,
    defaultTimeRange: { ...dashboard.defaultTimeRange },
    widgetCount: dashboardWidgets.length,
    canManage,
    createdAt: dashboard.createdAt,
    tenant,
    role: membership.role,
    widgets: dashboardWidgets,
  };
}

export function addDashboardWidget(input: {
  tenantSlug: string;
  workspaceId: string;
  dashboardId: string;
  createdByUserId: string;
  kind: WidgetKind;
  title: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  timeRangeOverride?: DashboardTimeRange;
}): WidgetView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    throw new Error("workspace_not_found");
  }

  const dashboard = getDashboardRecord(input.dashboardId);

  if (!dashboard || dashboard.workspaceId !== workspace.id) {
    throw new Error("dashboard_not_found");
  }

  if (
    !canManageWorkspaceDashboards(
      input.tenantSlug,
      input.workspaceId,
      input.createdByUserId,
    )
  ) {
    throw new Error("forbidden");
  }

  if (!isWidgetKind(input.kind)) {
    throw new Error("widget_kind_required");
  }

  const title = input.title.trim();

  if (!title) {
    throw new Error("title_required");
  }

  if (
    !Number.isFinite(input.x) ||
    !Number.isFinite(input.y) ||
    !Number.isFinite(input.width) ||
    !Number.isFinite(input.height) ||
    input.width <= 0 ||
    input.height <= 0
  ) {
    throw new Error("widget_layout_required");
  }

  const timeRangeOverride = input.timeRangeOverride
    ? parseTimeRangeInput(input.timeRangeOverride)
    : undefined;

  if (input.timeRangeOverride && !timeRangeOverride) {
    throw new Error("time_range_required");
  }

  const widget: Widget = {
    id: createWidgetId(),
    dashboardId: dashboard.id,
    kind: input.kind,
    title,
    description: input.description?.trim() ?? "",
    x: Math.floor(input.x),
    y: Math.floor(input.y),
    width: Math.floor(input.width),
    height: Math.floor(input.height),
    timeRangeOverride: timeRangeOverride
      ? { ...timeRangeOverride }
      : undefined,
  };

  widgets.push(widget);

  recordDashboardRevision({
    dashboardId: dashboard.id,
    workspaceId: workspace.id,
    userId: input.createdByUserId,
    isSnapshot: false,
    label: `Auto-saved at ${new Date().toISOString()}`,
  });

  return {
    ...widget,
    timeRangeOverride: widget.timeRangeOverride
      ? { ...widget.timeRangeOverride }
      : undefined,
  };
}

export function parseWidgetKindInput(value: unknown): WidgetKind | undefined {
  return isWidgetKind(value) ? value : undefined;
}

function revisionToView(
  revision: DashboardRevision,
  tenantSlug: string,
): DashboardRevisionView {
  const user = getUserById(revision.createdByUserId);

  return {
    id: revision.id,
    dashboardId: revision.dashboardId,
    workspaceId: revision.workspaceId,
    tenantSlug,
    isSnapshot: revision.isSnapshot,
    label: revision.label,
    createdBy: {
      id: revision.createdByUserId,
      name: user?.name ?? "Unknown user",
    },
    createdAt: revision.createdAt,
    widgetCount: revision.state.widgets.length,
  };
}

function recordDashboardRevision(input: {
  dashboardId: string;
  workspaceId: string;
  userId: string;
  isSnapshot: boolean;
  label: string;
}): DashboardRevision {
  const dashboard = getDashboardRecord(input.dashboardId);

  if (!dashboard || dashboard.workspaceId !== input.workspaceId) {
    throw new Error("dashboard_not_found");
  }

  const dashboardWidgets = widgets.filter(
    (widget) => widget.dashboardId === dashboard.id,
  );

  const state: DashboardRevisionState = {
    dashboard: cloneDashboardRecord(dashboard),
    widgets: dashboardWidgets.map(cloneWidget),
  };

  const revision: DashboardRevision = {
    id: createRevisionId(),
    dashboardId: dashboard.id,
    workspaceId: dashboard.workspaceId,
    isSnapshot: input.isSnapshot,
    label: input.label.trim() || `Revision at ${new Date().toISOString()}`,
    createdByUserId: input.userId,
    createdAt: new Date().toISOString(),
    state,
  };

  revisions.unshift(revision);

  return revision;
}

export function cloneDashboard(input: {
  tenantSlug: string;
  workspaceId: string;
  sourceDashboardId: string;
  createdByUserId: string;
  name?: string;
  description?: string;
}): DashboardView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    throw new Error("workspace_not_found");
  }

  if (
    !canManageWorkspaceDashboards(
      input.tenantSlug,
      input.workspaceId,
      input.createdByUserId,
    )
  ) {
    throw new Error("forbidden");
  }

  const source = getDashboardRecord(input.sourceDashboardId);

  if (!source || source.workspaceId !== workspace.id) {
    throw new Error("dashboard_not_found");
  }

  const requestedName = input.name?.trim() ?? `${source.name} (Copy)`;

  if (!requestedName) {
    throw new Error("name_required");
  }

  let name = requestedName;
  let suffix = 2;

  while (
    dashboards.some(
      (dashboard) =>
        dashboard.workspaceId === workspace.id &&
        dashboard.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    name = `${requestedName} (${suffix})`;
    suffix += 1;
  }

  const description = input.description?.trim() ?? source.description;

  const dashboard: Dashboard = {
    id: createDashboardId(),
    workspaceId: workspace.id,
    name,
    description,
    defaultTimeRange: { ...source.defaultTimeRange },
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  };

  dashboards.unshift(dashboard);

  const sourceWidgets = widgets.filter(
    (widget) => widget.dashboardId === source.id,
  );

  for (const widget of sourceWidgets) {
    widgets.push({
      ...cloneWidget(widget),
      id: createWidgetId(),
      dashboardId: dashboard.id,
    });
  }

  recordDashboardRevision({
    dashboardId: dashboard.id,
    workspaceId: workspace.id,
    userId: input.createdByUserId,
    isSnapshot: false,
    label: `Cloned from ${source.name}`,
  });

  return {
    id: dashboard.id,
    workspaceId: dashboard.workspaceId,
    tenantSlug: tenant.slug,
    name: dashboard.name,
    description: dashboard.description,
    defaultTimeRange: { ...dashboard.defaultTimeRange },
    widgetCount: sourceWidgets.length,
    canManage: true,
    createdAt: dashboard.createdAt,
  };
}

export function createDashboardSnapshot(input: {
  tenantSlug: string;
  workspaceId: string;
  dashboardId: string;
  createdByUserId: string;
  name: string;
}): DashboardRevisionView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    throw new Error("workspace_not_found");
  }

  const dashboard = getDashboardRecord(input.dashboardId);

  if (!dashboard || dashboard.workspaceId !== workspace.id) {
    throw new Error("dashboard_not_found");
  }

  if (
    !canManageWorkspaceDashboards(
      input.tenantSlug,
      input.workspaceId,
      input.createdByUserId,
    )
  ) {
    throw new Error("forbidden");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("snapshot_name_required");
  }

  const revision = recordDashboardRevision({
    dashboardId: dashboard.id,
    workspaceId: workspace.id,
    userId: input.createdByUserId,
    isSnapshot: true,
    label: name,
  });

  return revisionToView(revision, tenant.slug);
}

export function listDashboardRevisions(input: {
  tenantSlug: string;
  workspaceId: string;
  dashboardId: string;
  userId: string;
}): DashboardRevisionView[] | null {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    return null;
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return null;
  }

  const dashboard = getDashboardRecord(input.dashboardId);

  if (!dashboard || dashboard.workspaceId !== workspace.id) {
    return null;
  }

  const membership = workspaceMemberships.find(
    (entry) =>
      entry.workspaceId === workspace.id && entry.userId === input.userId,
  );

  if (!membership) {
    return null;
  }

  return revisions
    .filter((revision) => revision.dashboardId === dashboard.id)
    .map((revision) => revisionToView(revision, tenant.slug));
}

export function restoreDashboardRevision(input: {
  tenantSlug: string;
  workspaceId: string;
  dashboardId: string;
  revisionId: string;
  userId: string;
}): DashboardDetailView | null {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    return null;
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return null;
  }

  const dashboard = getDashboardRecord(input.dashboardId);

  if (!dashboard || dashboard.workspaceId !== workspace.id) {
    return null;
  }

  const revision = getRevisionRecord(input.revisionId);

  if (!revision || revision.dashboardId !== dashboard.id) {
    throw new Error("revision_not_found");
  }

  if (
    !canManageWorkspaceDashboards(
      input.tenantSlug,
      input.workspaceId,
      input.userId,
    )
  ) {
    throw new Error("forbidden");
  }

  const restoredState = cloneRevisionState(revision.state);

  dashboard.name = restoredState.dashboard.name;
  dashboard.description = restoredState.dashboard.description;
  dashboard.defaultTimeRange = { ...restoredState.dashboard.defaultTimeRange };

  widgets = widgets.filter((widget) => widget.dashboardId !== dashboard.id);
  for (const widget of restoredState.widgets) {
    widgets.push(cloneWidget(widget));
  }

  recordDashboardRevision({
    dashboardId: dashboard.id,
    workspaceId: workspace.id,
    userId: input.userId,
    isSnapshot: false,
    label: `Restored from ${revision.label}`,
  });

  return resolveDashboard(
    input.tenantSlug,
    input.workspaceId,
    dashboard.id,
    input.userId,
  );
}

function cloneSource(source: Source): Source {
  return {
    ...source,
    config: { ...source.config },
  };
}

function cloneSubscription(
  subscription: SourceSubscription,
): SourceSubscription {
  return {
    ...subscription,
    filter: { keywords: [...subscription.filter.keywords] },
  };
}

function cloneObservation(observation: Observation): Observation {
  return {
    ...observation,
    articleIdentity: { ...observation.articleIdentity },
    evidence: observation.evidence.map((entry) => ({ ...entry })),
  };
}

function normalizeFeedUrl(url: string): string {
  return url.trim();
}

function isHttpUrl(value: string): boolean {
  try {
    const candidate = new URL(value);
    return candidate.protocol === "http:" || candidate.protocol === "https:";
  } catch {
    return false;
  }
}

function parseKeywordsInput(value: unknown): string[] {
  if (Array.isArray(value)) {
    return parseKeywordEntries(value);
  }

  if (typeof value === "string") {
    return parseKeywordEntries(value.split(/[,\n]/));
  }

  return [];
}

function parseKeywordEntries(entries: unknown[]): string[] {
  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim().toLowerCase();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    keywords.push(trimmed);
  }

  return keywords;
}

function normalizeFeedItemInput(
  value: unknown,
): RssFeedItemInput | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as {
    url?: unknown;
    title?: unknown;
    publishedAt?: unknown;
  };

  if (
    typeof candidate.url !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.publishedAt !== "string"
  ) {
    return undefined;
  }

  const url = candidate.url.trim();
  const title = candidate.title.trim();
  const publishedAt = candidate.publishedAt.trim();

  if (!url || !title || !publishedAt) {
    return undefined;
  }

  return { url, title, publishedAt };
}

const ISO_PUBLISHED_AT_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

function parsePublishedAt(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed || !ISO_PUBLISHED_AT_PATTERN.test(trimmed)) {
    return undefined;
  }

  const timestamp = Date.parse(trimmed);

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return trimmed;
}

function observationToView(
  observation: Observation,
  tenantSlug: string,
  source: Source | undefined,
): ObservationView {
  if (!source) {
    throw new Error("source_not_found");
  }

  return {
    id: observation.id,
    tenantSlug,
    sourceId: observation.sourceId,
    sourceName: source.name,
    sourceKind: source.kind,
    articleUrl: observation.articleIdentity.url,
    title: observation.title,
    publishedAt: observation.publishedAt,
    collectedAt: observation.collectedAt,
    evidenceCount: observation.evidence.length,
    citationNote: observation.citationNote,
  };
}

function observationMatchesFilter(
  observation: Observation,
  filter: SubscriptionFilter,
): boolean {
  if (filter.keywords.length === 0) {
    return true;
  }

  const haystack = observation.title.toLowerCase();

  return filter.keywords.some((keyword) => haystack.includes(keyword));
}

export function canManageTenantSources(
  tenantSlug: string,
  userId: string,
): boolean {
  return canManageTenantInvitations(tenantSlug, userId);
}

export function createTenantRssSource(input: {
  tenantSlug: string;
  createdByUserId: string;
  name: string;
  feedUrl: string;
}): SourceView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  if (!canManageTenantSources(input.tenantSlug, input.createdByUserId)) {
    throw new Error("forbidden");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("name_required");
  }

  const feedUrl = normalizeFeedUrl(input.feedUrl);

  if (!feedUrl || !isHttpUrl(feedUrl)) {
    throw new Error("feed_url_required");
  }

  if (
    sources.some(
      (source) =>
        source.tenantId === tenant.id &&
        source.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new Error("source_already_exists");
  }

  if (
    sources.some(
      (source) =>
        source.tenantId === tenant.id &&
        source.kind === "rss" &&
        (source.config as RssSourceConfig).feedUrl === feedUrl,
    )
  ) {
    throw new Error("source_feed_already_registered");
  }

  const source: Source = {
    id: createSourceId(),
    tenantId: tenant.id,
    name,
    kind: "rss",
    config: { feedUrl },
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  };

  sources.unshift(source);

  return sourceToView(source, tenant.slug, true);
}

export function createTenantManualSource(input: {
  tenantSlug: string;
  createdByUserId: string;
  name: string;
  description?: string;
}): SourceView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  if (!canManageTenantSources(input.tenantSlug, input.createdByUserId)) {
    throw new Error("forbidden");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("name_required");
  }

  if (
    sources.some(
      (source) =>
        source.tenantId === tenant.id &&
        source.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new Error("source_already_exists");
  }

  const description = input.description?.trim();
  const config: ManualSourceConfig = description ? { description } : {};

  const source: Source = {
    id: createSourceId(),
    tenantId: tenant.id,
    name,
    kind: "manual",
    config,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  };

  sources.unshift(source);

  return sourceToView(source, tenant.slug, true);
}

function sourceToView(
  source: Source,
  tenantSlug: string,
  canManage: boolean,
): SourceView {
  const health = computeSourceHealthStatus(source.id);

  if (source.kind === "rss") {
    const rssConfig = source.config as RssSourceConfig;
    return {
      id: source.id,
      tenantSlug,
      name: source.name,
      kind: source.kind,
      feedUrl: rssConfig.feedUrl,
      description: "",
      createdAt: source.createdAt,
      canManage,
      health,
    };
  }

  const manualConfig = source.config as ManualSourceConfig;
  return {
    id: source.id,
    tenantSlug,
    name: source.name,
    kind: source.kind,
    feedUrl: "",
    description: manualConfig.description ?? "",
    createdAt: source.createdAt,
    canManage,
    health,
  };
}

export function listTenantSources(
  tenantSlug: string,
  userId: string,
): SourceView[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  const membership = tenantMemberships.find(
    (entry) => entry.tenantId === tenant.id && entry.userId === userId,
  );

  if (!membership) {
    return [];
  }

  const canManage = canManageTenantSources(tenantSlug, userId);

  return sources
    .filter((source) => source.tenantId === tenant.id)
    .map((source) => sourceToView(source, tenant.slug, canManage));
}

export function getTenantSource(
  tenantSlug: string,
  sourceId: string,
  userId: string,
): SourceView | null {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const source = getSourceRecord(sourceId);

  if (!source || source.tenantId !== tenant.id) {
    return null;
  }

  const membership = tenantMemberships.find(
    (entry) => entry.tenantId === tenant.id && entry.userId === userId,
  );

  if (!membership) {
    return null;
  }

  return sourceToView(source, tenant.slug, canManageTenantSources(tenantSlug, userId));
}

export function canManageWorkspaceSubscriptions(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): boolean {
  const membership = getWorkspaceMembership(tenantSlug, workspaceId, userId);
  return membership?.role === "admin";
}

export function canManageWorkspaceObservations(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): boolean {
  const membership = getWorkspaceMembership(tenantSlug, workspaceId, userId);
  return membership?.role === "admin" || membership?.role === "editor";
}

export function createSourceSubscription(input: {
  tenantSlug: string;
  workspaceId: string;
  sourceId: string;
  createdByUserId: string;
  keywords?: string[];
}): SourceSubscriptionView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    throw new Error("workspace_not_found");
  }

  const source = getSourceRecord(input.sourceId);

  if (!source || source.tenantId !== tenant.id) {
    throw new Error("source_not_found");
  }

  if (
    !canManageWorkspaceSubscriptions(
      input.tenantSlug,
      input.workspaceId,
      input.createdByUserId,
    )
  ) {
    throw new Error("forbidden");
  }

  if (
    subscriptions.some(
      (subscription) =>
        subscription.workspaceId === workspace.id &&
        subscription.sourceId === source.id,
    )
  ) {
    throw new Error("subscription_already_exists");
  }

  const keywords = parseKeywordsInput(input.keywords ?? []);

  const subscription: SourceSubscription = {
    id: createSubscriptionId(),
    tenantId: tenant.id,
    workspaceId: workspace.id,
    sourceId: source.id,
    filter: { keywords },
    subscribedByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  };

  subscriptions.unshift(subscription);

  return {
    id: subscription.id,
    tenantSlug: tenant.slug,
    workspaceId: subscription.workspaceId,
    workspaceName: workspace.name,
    sourceId: source.id,
    sourceName: source.name,
    feedUrl:
      source.kind === "rss" ? (source.config as RssSourceConfig).feedUrl : "",
    filter: { keywords: [...keywords] },
    createdAt: subscription.createdAt,
  };
}

export function listWorkspaceSourceSubscriptions(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): SourceSubscriptionView[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  const workspace = getWorkspaceById(workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return [];
  }

  const membership = workspaceMemberships.find(
    (entry) =>
      entry.workspaceId === workspaceId && entry.userId === userId,
  );

  if (!membership) {
    return [];
  }

  return subscriptions
    .filter((subscription) => subscription.workspaceId === workspaceId)
    .map((subscription) => {
      const source = getSourceRecord(subscription.sourceId);

      return {
        id: subscription.id,
        tenantSlug: tenant.slug,
        workspaceId: subscription.workspaceId,
        workspaceName: workspace.name,
        sourceId: subscription.sourceId,
        sourceName: source?.name ?? "Unknown source",
        feedUrl:
          source?.kind === "rss"
            ? (source.config as RssSourceConfig).feedUrl
            : "",
        filter: { keywords: [...subscription.filter.keywords] },
        createdAt: subscription.createdAt,
      };
    });
}

export function listWorkspaceSources(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): SourceView[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  const workspace = getWorkspaceById(workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return [];
  }

  const membership = workspaceMemberships.find(
    (entry) =>
      entry.workspaceId === workspaceId && entry.userId === userId,
  );

  if (!membership) {
    return [];
  }

  const subscribedSourceIds = new Set(
    subscriptions
      .filter((subscription) => subscription.workspaceId === workspaceId)
      .map((subscription) => subscription.sourceId),
  );

  const canManage = canManageWorkspaceSubscriptions(
    tenantSlug,
    workspaceId,
    userId,
  );

  return sources
    .filter(
      (source) =>
        source.tenantId === tenant.id && subscribedSourceIds.has(source.id),
    )
    .map((source) => sourceToView(source, tenant.slug, canManage));
}

export function listWorkspaceObservations(
  tenantSlug: string,
  workspaceId: string,
  userId: string,
): ObservationView[] {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return [];
  }

  const workspace = getWorkspaceById(workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    return [];
  }

  const membership = workspaceMemberships.find(
    (entry) =>
      entry.workspaceId === workspaceId && entry.userId === userId,
  );

  if (!membership) {
    return [];
  }

  const workspaceSubscriptions = subscriptions.filter(
    (subscription) => subscription.workspaceId === workspaceId,
  );

  const observationsBySourceId = new Map<string, SourceSubscription>();

  for (const subscription of workspaceSubscriptions) {
    observationsBySourceId.set(subscription.sourceId, subscription);
  }

  return observations
    .filter((observation) =>
      observationsBySourceId.has(observation.sourceId),
    )
    .filter((observation) => {
      const subscription = observationsBySourceId.get(observation.sourceId);

      if (!subscription) {
        return false;
      }

      return observationMatchesFilter(observation, subscription.filter);
    })
    .map((observation) => {
      const source = getSourceRecord(observation.sourceId);
      return observationToView(observation, tenant.slug, source);
    });
}

export function collectTenantRssSource(input: {
  tenantSlug: string;
  sourceId: string;
  collectedByUserId: string;
  items: unknown;
}): RssCollectionResult {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  if (!canManageTenantSources(input.tenantSlug, input.collectedByUserId)) {
    throw new Error("forbidden");
  }

  const source = getSourceRecord(input.sourceId);

  if (!source || source.tenantId !== tenant.id) {
    throw new Error("source_not_found");
  }

  if (source.kind !== "rss") {
    throw new Error("source_kind_unsupported");
  }

  const startedAt = new Date().toISOString();

  try {
    if (!Array.isArray(input.items)) {
      throw new Error("items_required");
    }
    const created: Observation[] = [];
    let duplicateCount = 0;
    const collectedAt = new Date().toISOString();

    for (const rawItem of input.items) {
      const parsed = parseFeedItemInput(rawItem);

      if (!parsed) {
        throw new Error("feed_item_required");
      }

      const articleUrl = parsed.url;

      const alreadySeen = observations.some(
        (entry) =>
          entry.sourceId === source.id &&
          entry.articleIdentity.url === articleUrl,
      );

      if (alreadySeen) {
        duplicateCount += 1;
        continue;
      }

      const observation: Observation = {
        id: createObservationId(),
        tenantId: tenant.id,
        sourceId: source.id,
        articleIdentity: { url: articleUrl },
        title: parsed.title,
        publishedAt: parsed.publishedAt,
        collectedAt,
        evidence: [{ url: articleUrl, snapshotAt: collectedAt }],
      };

      observations.unshift(observation);
      created.push(observation);
    }

    const resultView: ObservationView[] = created.map((observation) =>
      observationToView(observation, tenant.slug, source),
    );

    const run = recordCollectionRun({
      tenantId: tenant.id,
      sourceId: source.id,
      outcome: "success",
      itemsCollected: created.length,
      duplicatesSkipped: duplicateCount,
      startedAt,
    });

    const runView = collectionRunToView(run, tenant.slug, source.name);

    return { created, duplicateCount, observations: resultView, run: runView };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "unknown_error";

    recordCollectionRun({
      tenantId: tenant.id,
      sourceId: source.id,
      outcome: "failure",
      itemsCollected: 0,
      duplicatesSkipped: 0,
      errorMessage,
      startedAt,
    });

    throw error;
  }
}

export function createManualObservation(input: {
  tenantSlug: string;
  workspaceId: string;
  sourceId: string;
  createdByUserId: string;
  title: string;
  publishedAt: string;
  citationNote: string;
  articleUrl?: string;
}): ObservationView {
  const tenant = getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error("tenant_not_found");
  }

  const workspace = getWorkspaceById(input.workspaceId);

  if (!workspace || workspace.tenantId !== tenant.id) {
    throw new Error("workspace_not_found");
  }

  if (
    !canManageWorkspaceObservations(
      input.tenantSlug,
      input.workspaceId,
      input.createdByUserId,
    )
  ) {
    throw new Error("forbidden");
  }

  const source = getSourceRecord(input.sourceId);

  if (!source || source.tenantId !== tenant.id) {
    throw new Error("source_not_found");
  }

  if (source.kind !== "manual") {
    throw new Error("source_kind_unsupported");
  }

  const title = input.title.trim();

  if (!title) {
    throw new Error("title_required");
  }

  const publishedAt = parsePublishedAt(input.publishedAt);

  if (!publishedAt) {
    throw new Error(input.publishedAt.trim() ? "published_at_invalid" : "published_at_required");
  }

  const citationNote = input.citationNote.trim();

  if (!citationNote) {
    throw new Error("citation_note_required");
  }

  const articleUrl = input.articleUrl?.trim() ?? "";

  if (articleUrl && !isHttpUrl(articleUrl)) {
    throw new Error("article_url_invalid");
  }

  const subscription = subscriptions.find(
    (entry) =>
      entry.workspaceId === workspace.id && entry.sourceId === source.id,
  );

  if (!subscription) {
    throw new Error("source_not_subscribed");
  }

  const collectedAt = new Date().toISOString();

  const evidence: ObservationEvidence[] = articleUrl
    ? [{ url: articleUrl, snapshotAt: collectedAt }]
    : [];

  const observation: Observation = {
    id: createObservationId(),
    tenantId: tenant.id,
    sourceId: source.id,
    articleIdentity: { url: articleUrl },
    title,
    publishedAt,
    collectedAt,
    citationNote,
    evidence,
  };

  observations.unshift(observation);

  return observationToView(observation, tenant.slug, source);
}

function parseFeedItemInput(value: unknown): RssFeedItemInput | undefined {
  const parsed = normalizeFeedItemInput(value);

  if (!parsed) {
    return undefined;
  }

  if (!isHttpUrl(parsed.url)) {
    return undefined;
  }

  return parsed;
}

export function parseRssFeedItemInput(value: unknown): RssFeedItemInput | undefined {
  return parseFeedItemInput(value);
}

export function parseSubscriptionKeywordsInput(value: unknown): string[] {
  return parseKeywordsInput(value);
}

export {
  cloneSource,
  cloneSubscription,
  cloneObservation,
};

function computeSourceHealthStatus(sourceId: string): SourceHealthStatus {
  const sourceRuns = collectionRuns.filter(
    (run) => run.sourceId === sourceId,
  );

  if (sourceRuns.length === 0) {
    return "unknown";
  }

  const sorted = [...sourceRuns].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  if (sorted[0].outcome === "success") {
    return "healthy";
  }

  const recentWindow = sorted.slice(0, 5);
  const allFailed = recentWindow.every((run) => run.outcome === "failure");

  return allFailed ? "failing" : "degraded";
}

function collectionRunToView(
  run: CollectionRun,
  tenantSlug: string,
  sourceName: string,
): CollectionRunView {
  return {
    id: run.id,
    tenantSlug,
    sourceId: run.sourceId,
    sourceName,
    outcome: run.outcome,
    itemsCollected: run.itemsCollected,
    duplicatesSkipped: run.duplicatesSkipped,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
  };
}

function recordCollectionRun(input: {
  tenantId: string;
  sourceId: string;
  outcome: CollectionRunOutcome;
  itemsCollected: number;
  duplicatesSkipped: number;
  errorMessage?: string;
  startedAt: string;
}): CollectionRun {
  const run: CollectionRun = {
    id: createCollectionRunId(),
    tenantId: input.tenantId,
    sourceId: input.sourceId,
    outcome: input.outcome,
    itemsCollected: input.itemsCollected,
    duplicatesSkipped: input.duplicatesSkipped,
    errorMessage: input.errorMessage,
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
  };

  collectionRuns.unshift(run);

  return run;
}

export function listSourceCollectionRuns(
  tenantSlug: string,
  sourceId: string,
  userId: string,
): CollectionRunView[] | null {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const source = getSourceRecord(sourceId);

  if (!source || source.tenantId !== tenant.id) {
    return null;
  }

  const membership = tenantMemberships.find(
    (entry) => entry.tenantId === tenant.id && entry.userId === userId,
  );

  if (!membership) {
    return null;
  }

  return collectionRuns
    .filter((run) => run.sourceId === sourceId)
    .map((run) => collectionRunToView(run, tenant.slug, source.name));
}

export function getSourceHealth(
  tenantSlug: string,
  sourceId: string,
  userId: string,
): SourceHealthView | null {
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const source = getSourceRecord(sourceId);

  if (!source || source.tenantId !== tenant.id) {
    return null;
  }

  const membership = tenantMemberships.find(
    (entry) => entry.tenantId === tenant.id && entry.userId === userId,
  );

  if (!membership) {
    return null;
  }

  const sourceRuns = collectionRuns.filter(
    (run) => run.sourceId === sourceId,
  );

  const status = computeSourceHealthStatus(sourceId);

  const sorted = [...sourceRuns].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  const lastRunAt = sorted.length > 0 ? sorted[0].completedAt : undefined;
  const lastSuccessAt = sorted.find(
    (run) => run.outcome === "success",
  )?.completedAt;

  const recentFailureCount = sourceRuns.filter(
    (run) => run.outcome === "failure",
  ).length;

  return {
    sourceId,
    tenantSlug: tenant.slug,
    status,
    lastRunAt,
    lastSuccessAt,
    recentFailureCount,
    totalRuns: sourceRuns.length,
  };
}
