import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  canManageWorkspaceSubscriptions,
  listTenantSources,
  listWorkspaceSourceSubscriptions,
  resolveWorkspace,
} from "@/lib/tenant-home";

type WorkspaceSubscriptionsPageProps = {
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
    case "source_not_found":
      return "That source could not be found in this tenant.";
    case "workspace_not_found":
      return "This workspace could not be found in this tenant.";
    case "subscription_already_exists":
      return "This workspace is already subscribed to that source.";
    case "forbidden":
      return "Only workspace admins can attach source subscriptions.";
    default:
      return undefined;
  }
}

export default async function WorkspaceSubscriptionsPage({
  params,
  searchParams,
}: WorkspaceSubscriptionsPageProps) {
  const { tenantSlug, workspaceId } = await params;
  const query = (await searchParams) ?? {};
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/subscriptions`,
      )}`,
    );
  }

  const workspace = resolveWorkspace(tenantSlug, workspaceId, session.userId);

  if (!workspace) {
    redirect("/unauthorized");
  }

  const subscriptions = listWorkspaceSourceSubscriptions(
    tenantSlug,
    workspaceId,
    session.userId,
  );
  const tenantSources = listTenantSources(tenantSlug, session.userId);
  const subscribedIds = new Set(subscriptions.map((entry) => entry.sourceId));
  const availableSources = tenantSources.filter(
    (entry) => !subscribedIds.has(entry.id),
  );
  const canManage = canManageWorkspaceSubscriptions(
    tenantSlug,
    workspaceId,
    session.userId,
  );
  const errorMessage = describeError(query.error);

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Source subscriptions</span>
          <h1>{workspace.name}</h1>
          <p className="muted">
            Tenant: {workspace.tenant.name} - Your role: {workspace.role}
          </p>
          <p className="muted">
            Attach this workspace to tenant-owned sources. Optional keyword
            filters narrow which observations appear here.
          </p>
        </div>

        {query.created ? (
          <p className="notice">
            Subscription {query.created} was created.
          </p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {canManage ? (
          <form
            action={`/tenant/${tenantSlug}/workspaces/${workspaceId}/subscriptions/create`}
            className="stack"
            method="post"
          >
            <h2>Attach a source</h2>
            <p className="muted">
              Pick a tenant-owned source. Optionally restrict observations to
              those whose titles contain any of the listed keywords (case
              insensitive, comma-separated).
            </p>
            <div className="field-grid">
              <label className="field">
                <span>Source</span>
                <select
                  name="sourceId"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a source
                  </option>
                  {availableSources.length === 0 ? (
                    <option value="" disabled>
                      No unsubscribed tenant sources available
                    </option>
                  ) : (
                    availableSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name} - {source.feedUrl}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="field">
                <span>Keywords (optional)</span>
                <input
                  name="keywords"
                  placeholder="e.g. launch, pricing"
                  type="text"
                />
              </label>
            </div>
            <div className="actions">
              <button className="button" type="submit">
                Create subscription
              </button>
            </div>
          </form>
        ) : null}

        <div className="stack">
          <h2>Active subscriptions</h2>
          {subscriptions.length === 0 ? (
            <p className="muted">
              This workspace is not subscribed to any tenant sources yet.
            </p>
          ) : (
            <ul className="workspace-list">
              {subscriptions.map((subscription) => (
                <li
                  className="workspace-item stack"
                  key={subscription.id}
                >
                  <div className="actions">
                    <strong>{subscription.sourceName}</strong>
                    <span className="pill">{subscription.id}</span>
                  </div>
                  <p className="muted">{subscription.feedUrl}</p>
                  <p className="muted">
                    Keywords:{" "}
                    {subscription.filter.keywords.length === 0
                      ? "(none - all observations)"
                      : subscription.filter.keywords.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="actions">
          <Link
            className="button secondary"
            href={`/tenant/${tenantSlug}/workspaces/${workspaceId}`}
          >
            Back to workspace
          </Link>
          <Link
            className="button secondary"
            href={`/tenant/${tenantSlug}/workspaces/${workspaceId}/observations`}
          >
            View observations
          </Link>
        </div>
      </div>
    </main>
  );
}
