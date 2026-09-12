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

let users = cloneUsers(initialUsers);
let tenantMemberships = cloneTenantMemberships(initialTenantMemberships);
let workspaceMemberships = cloneWorkspaceMemberships(initialWorkspaceMemberships);
let invitations: Invitation[] = [];
let dashboards: Dashboard[] = [];
let widgets: Widget[] = [];
let revisions: DashboardRevision[] = [];

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
  nextUserId = 1;
  nextInvitationId = 1;
  nextWorkspaceId = 1;
  nextDashboardId = 1;
  nextWidgetId = 1;
  nextRevisionId = 1;
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
