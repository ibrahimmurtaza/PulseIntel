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

let users = cloneUsers(initialUsers);
let tenantMemberships = cloneTenantMemberships(initialTenantMemberships);
let workspaceMemberships = cloneWorkspaceMemberships(initialWorkspaceMemberships);
let invitations: Invitation[] = [];

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
  nextUserId = 1;
  nextInvitationId = 1;
  nextWorkspaceId = 1;
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
