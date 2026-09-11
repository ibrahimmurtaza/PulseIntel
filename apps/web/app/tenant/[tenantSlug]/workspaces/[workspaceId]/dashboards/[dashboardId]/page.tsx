import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import { resolveDashboard } from "@/lib/tenant-home";

type DashboardDetailPageProps = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    error?: string;
  }>;
};

const WIDGET_KIND_LABELS: Record<string, string> = {
  chart: "Chart",
  feed: "Feed",
  metric: "Metric",
  insight: "Insight",
};

function describeError(error?: string) {
  switch (error) {
    case "widget_kind_required":
      return "Select a widget type.";
    case "title_required":
      return "Widget title is required.";
    case "widget_layout_required":
      return "Widget x, y, width, and height must be valid positive integers.";
    case "time_range_required":
      return "Provide a label and positive window (days) for the override.";
    case "dashboard_not_found":
      return "This dashboard could not be found in this workspace.";
    case "forbidden":
      return "Only workspace editors and admins can add widgets.";
    default:
      return undefined;
  }
}

export default async function DashboardDetailPage({
  params,
  searchParams,
}: DashboardDetailPageProps) {
  const { tenantSlug, workspaceId, dashboardId } = await params;
  const query = (await searchParams) ?? {};
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboardId}`,
      )}`,
    );
  }

  const dashboard = resolveDashboard(
    tenantSlug,
    workspaceId,
    dashboardId,
    session.userId,
  );

  if (!dashboard) {
    redirect("/unauthorized");
  }

  const errorMessage = describeError(query.error);

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Dashboard</span>
          <h1>{dashboard.name}</h1>
          <p className="muted">
            Tenant: {dashboard.tenant.name} - Your role: {dashboard.role}
          </p>
          <p>{dashboard.description || "No description provided."}</p>
        </div>

        <div className="stack">
          <h2>Default time range</h2>
          <p>
            <strong>{dashboard.defaultTimeRange.label}</strong> -{" "}
            {dashboard.defaultTimeRange.windowDays} days
          </p>
          <p className="muted">
            Applies to every widget on this dashboard unless a widget has its
            own override.
          </p>
        </div>

        {query.created ? (
          <p className="notice">Widget {query.created} was added.</p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {dashboard.canManage ? (
          <form
            action={`/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboard.id}/widgets/create`}
            className="stack"
            method="post"
          >
            <h2>Add widget</h2>
            <div className="field-grid">
              <label className="field">
                <span>Type</span>
                <select name="kind" required defaultValue="chart">
                  <option value="chart">Chart</option>
                  <option value="feed">Feed</option>
                  <option value="metric">Metric</option>
                  <option value="insight">Insight</option>
                </select>
              </label>
              <label className="field">
                <span>Title</span>
                <input name="title" required type="text" />
              </label>
              <label className="field">
                <span>Description</span>
                <input name="description" placeholder="Optional summary" />
              </label>
              <label className="field">
                <span>Grid x</span>
                <input min={0} name="x" required type="number" defaultValue={0} />
              </label>
              <label className="field">
                <span>Grid y</span>
                <input min={0} name="y" required type="number" defaultValue={0} />
              </label>
              <label className="field">
                <span>Grid width</span>
                <input
                  min={1}
                  name="width"
                  required
                  type="number"
                  defaultValue={4}
                />
              </label>
              <label className="field">
                <span>Grid height</span>
                <input
                  min={1}
                  name="height"
                  required
                  type="number"
                  defaultValue={3}
                />
              </label>
            </div>
            <div className="stack">
              <label className="field">
                <span>
                  <input name="overrideEnabled" type="checkbox" /> Override
                  default time range
                </span>
              </label>
              <div className="field-grid">
                <label className="field">
                  <span>Override label</span>
                  <input name="timeRangeLabel" type="text" />
                </label>
                <label className="field">
                  <span>Override window (days)</span>
                  <input min={1} name="timeRangeWindowDays" type="number" />
                </label>
              </div>
            </div>
            <div className="actions">
              <button className="button" type="submit">
                Add widget
              </button>
              <Link
                className="button secondary"
                href={`/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards`}
              >
                Back to dashboards
              </Link>
            </div>
          </form>
        ) : null}

        <div className="stack">
          <h2>Widgets</h2>
          {dashboard.widgets.length === 0 ? (
            <p className="muted">No widgets yet on this dashboard.</p>
          ) : (
            <ul className="workspace-list">
              {dashboard.widgets.map((widget) => (
                <li className="workspace-item stack" key={widget.id}>
                  <div className="actions">
                    <strong>{widget.title}</strong>
                    <span className="pill">
                      {WIDGET_KIND_LABELS[widget.kind] ?? widget.kind}
                    </span>
                  </div>
                  <p className="muted">
                    {widget.description || "No description provided."}
                  </p>
                  <p className="muted">
                    Grid: x={widget.x} y={widget.y} width={widget.width}{" "}
                    height={widget.height}
                  </p>
                  <p className="muted">
                    Time range:{" "}
                    {widget.timeRangeOverride
                      ? `${widget.timeRangeOverride.label} - ${widget.timeRangeOverride.windowDays}d (override)`
                      : `${dashboard.defaultTimeRange.label} - ${dashboard.defaultTimeRange.windowDays}d (default)`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="actions">
          <Link
            className="button secondary"
            href={`/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards`}
          >
            Back to dashboards
          </Link>
          <Link
            className="button secondary"
            href={`/tenant/${tenantSlug}/workspaces/${workspaceId}`}
          >
            Back to workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
