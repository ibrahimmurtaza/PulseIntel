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

export type WorkspaceRole = "viewer" | "editor" | "admin";

export type TenantHomeWorkspace = {
  id: string;
  name: string;
  description: string;
  role: WorkspaceRole;
};

const users: User[] = [
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

const tenantMemberships = [
  { tenantId: "tenant_acme", userId: "usr_anna" },
  { tenantId: "tenant_acme", userId: "usr_maya" },
  { tenantId: "tenant_globex", userId: "usr_liam" },
] as const;

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

const workspaceMemberships = [
  { workspaceId: "ws_launch", userId: "usr_anna", role: "editor" },
  { workspaceId: "ws_pricing", userId: "usr_anna", role: "viewer" },
  { workspaceId: "ws_launch", userId: "usr_maya", role: "admin" },
  { workspaceId: "ws_pricing", userId: "usr_maya", role: "admin" },
  { workspaceId: "ws_strategy", userId: "usr_maya", role: "admin" },
  { workspaceId: "ws_globex_core", userId: "usr_liam", role: "admin" },
] as const satisfies ReadonlyArray<{
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}>;

export function listDemoUsers(): User[] {
  return users;
}

export function getUserById(userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}

export function resolveTenantHome(
  tenantSlug: string,
  userId: string,
): { tenant: Tenant; workspaces: TenantHomeWorkspace[] } | null {
  const tenant = tenants.find((entry) => entry.slug === tenantSlug);

  if (!tenant) {
    return null;
  }

  const hasTenantMembership = tenantMemberships.some(
    (membership) =>
      membership.tenantId === tenant.id && membership.userId === userId,
  );

  if (!hasTenantMembership) {
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
    workspaces: accessibleWorkspaces,
  };
}
