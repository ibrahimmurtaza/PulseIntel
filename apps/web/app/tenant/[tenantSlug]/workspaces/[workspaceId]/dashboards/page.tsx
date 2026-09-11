import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  canManageWorkspaceDashboards,
  listWorkspaceDashboards,
  resolveWorkspace,
} from "@/lib/tenant-home";

type WorkspaceDashboardsPageProps = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    error?: string;
  }>;
};

function describeError(error?: string) {
  switch (error) {
    case "name_required":
      return "Dashboard name is required.";
    case "dashboard_already_exists":
      return "A dashboard with that name already exists in this workspace.";
    case "time_range_required":
      return "Provide a label and positive window (days) for the default time range.";
    case "workspace_not_found":
      return "This workspace could not be found in this tenant.";
    case "forbidden":
      return "Only workspace editors and admins can create dashboards.";
    default:
      return undefined;
  }
}

export default async function WorkspaceDashboardsPage({
  params,
  searchParams,
}: WorkspaceDashboardsPageProps) {
  const { tenantSlug, workspaceId } = await params;
  const query = (await searchParams) ?? {};
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards`,
      )}`,
    );
  }

  const workspace = resolveWorkspace(tenantSlug, workspaceId, session.userId);

  if (!workspace) {
    redirect("/unauthorized");
  }

  const dashboards = listWorkspaceDashboards(
    tenantSlug,
    workspaceId,
    session.userId,
  );
  const canManage = canManageWorkspaceDashboards(
    tenantSlug,
    workspaceId,
    session.userId,
  );
  const errorMessage = describeError(query.error);

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Dashboards</span>
          <h1>{workspace.name}</h1>
          <p className="muted">
            Tenant: {workspace.tenant.name} - Your role: {workspace.role}
          </p>
          <p>
            Workspace editors and admins can create dashboards with fixed-grid
            widgets and a shared default time range.
          </p>
        </div>

        {query.created ? (
          <p className="notice">Dashboard {query.created} was created.</p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {canManage ? (
          <form
            action={`/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/create`}
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
              <label className="field">
                <span>Default time range label</span>
                <input
                  name="timeRangeLabel"
                  required
                  type="text"
                  defaultValue="Last 30 days"
                />
              </label>
              <label className="field">
                <span>Default time range (days)</span>
                <input
                  min={1}
                  name="timeRangeWindowDays"
                  required
                  type="number"
                  defaultValue={30}
                />
              </label>
            </div>
            <div className="actions">
              <button className="button" type="submit">
                Create dashboard
              </button>
              <Link
                className="button secondary"
                href={`/tenant/${tenantSlug}/workspaces/${workspaceId}`}
              >
                Back to workspace
              </Link>
            </div>
          </form>
        ) : (
          <div className="actions">
            <Link
              className="button secondary"
              href={`/tenant/${tenantSlug}/workspaces/${workspaceId}`}
            >
              Back to workspace
            </Link>
          </div>
        )}

        <div className="stack">
          <h2>Dashboards</h2>
          {dashboards.length === 0 ? (
            <p className="muted">
              No dashboards yet in this workspace.
              {canManage ? " Use the form above to create one." : ""}
            </p>
          ) : (
            <ul className="workspace-list">
              {dashboards.map((dashboard) => (
                <li className="workspace-item stack" key={dashboard.id}>
                  <div className="actions">
                    <strong>{dashboard.name}</strong>
                    <span className="pill">
                      {dashboard.defaultTimeRange.label} -{" "}
                      {dashboard.defaultTimeRange.windowDays}d
                    </span>
                  </div>
                  <p className="muted">
                    {dashboard.description || "No description provided."}
                  </p>
                  <p className="muted">
                    Widgets: {dashboard.widgetCount}
                  </p>
                  <div className="actions">
                    <Link
                      className="button secondary"
                      href={`/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboard.id}`}
                    >
                      Open dashboard
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
