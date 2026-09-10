import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  canManageTenantWorkspaces,
  getTenantBySlug,
  getWorkspaceMembership,
  listTenantWorkspacesForUser,
} from "@/lib/tenant-home";

type TenantWorkspacesPageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    error?: string;
  }>;
};

function describeError(error?: string) {
  switch (error) {
    case "name_required":
      return "Workspace name is required.";
    case "workspace_already_exists":
      return "A workspace with that name already exists in this tenant.";
    case "forbidden":
      return "Only tenant admins can create workspaces.";
    default:
      return undefined;
  }
}

export default async function TenantWorkspacesPage({
  params,
  searchParams,
}: TenantWorkspacesPageProps) {
  const { tenantSlug } = await params;
  const query = (await searchParams) ?? {};
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(`/tenant/${tenantSlug}/workspaces`)}`,
    );
  }

  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    redirect("/unauthorized");
  }

  const canManage = canManageTenantWorkspaces(tenantSlug, session.userId);
  const workspaces = listTenantWorkspacesForUser(tenantSlug, session.userId);
  const errorMessage = describeError(query.error);

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Workspaces</span>
          <h1>{tenant.name}</h1>
          <p className="muted">
            Tenant admins can create new workspaces and see all members of each
            workspace. Other users see the workspaces they belong to.
          </p>
        </div>

        {query.created ? (
          <p className="notice">Workspace {query.created} was created.</p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {canManage ? (
          <form
            action={`/tenant/${tenantSlug}/workspaces/create`}
            className="stack"
            method="post"
          >
            <div className="field-grid">
              <label className="field">
                <span>Name</span>
                <input name="name" required type="text" />
              </label>
              <label className="field">
                <span>Description</span>
                <input name="description" placeholder="Optional summary" />
              </label>
            </div>
            <div className="actions">
              <button className="button" type="submit">
                Create workspace
              </button>
              <Link className="button secondary" href={`/tenant/${tenantSlug}`}>
                Back to Tenant Home
              </Link>
            </div>
          </form>
        ) : (
          <div className="actions">
            <Link className="button secondary" href={`/tenant/${tenantSlug}`}>
              Back to Tenant Home
            </Link>
          </div>
        )}

        <div className="stack">
          <h2>Workspaces</h2>
          {workspaces.length === 0 ? (
            <p className="muted">
              You do not belong to any workspace in this tenant yet.
            </p>
          ) : (
            <ul className="workspace-list">
              {workspaces.map((workspace) => {
                const membership = getWorkspaceMembership(
                  tenantSlug,
                  workspace.id,
                  session.userId,
                );
                return (
                  <li className="workspace-item stack" key={workspace.id}>
                    <div className="actions">
                      <strong>{workspace.name}</strong>
                      {membership ? (
                        <span className="pill">{membership.role}</span>
                      ) : null}
                    </div>
                    <p className="muted">
                      {workspace.description || "No description provided."}
                    </p>
                    <p className="muted">
                      Members: {workspace.memberCount}
                    </p>
                    <div className="actions">
                      <Link
                        className="button secondary"
                        href={`/tenant/${tenantSlug}/workspaces/${workspace.id}`}
                      >
                        Open workspace
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
