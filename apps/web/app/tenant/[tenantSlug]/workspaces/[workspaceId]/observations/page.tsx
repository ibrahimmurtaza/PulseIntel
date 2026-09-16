import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  listWorkspaceObservations,
  resolveWorkspace,
} from "@/lib/tenant-home";

type WorkspaceObservationsPageProps = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

export default async function WorkspaceObservationsPage({
  params,
}: WorkspaceObservationsPageProps) {
  const { tenantSlug, workspaceId } = await params;
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/observations`,
      )}`,
    );
  }

  const workspace = resolveWorkspace(tenantSlug, workspaceId, session.userId);

  if (!workspace) {
    redirect("/unauthorized");
  }

  const observations = listWorkspaceObservations(
    tenantSlug,
    workspaceId,
    session.userId,
  );

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Observations</span>
          <h1>{workspace.name}</h1>
          <p className="muted">
            Tenant: {workspace.tenant.name} - Your role: {workspace.role}
          </p>
          <p className="muted">
            Observations come from the tenant sources this workspace is
            subscribed to. Items with an Article Identity are deduplicated
            across collections.
          </p>
        </div>

        <div className="stack">
          <h2>Collected observations</h2>
          {observations.length === 0 ? (
            <p className="muted">
              No observations collected yet. Ask a tenant admin to run a
              collection on a subscribed source.
            </p>
          ) : (
            <ul className="workspace-list">
              {observations.map((observation) => (
                <li
                  className="workspace-item stack"
                  key={observation.id}
                >
                  <div className="actions">
                    <strong>{observation.title}</strong>
                    <span className="pill">
                      {observation.sourceName}
                    </span>
                  </div>
                  <p className="muted">
                    Article:{" "}
                    <a href={observation.articleUrl} rel="noreferrer" target="_blank">
                      {observation.articleUrl}
                    </a>
                  </p>
                  <p className="muted">
                    Published {observation.publishedAt} - first collected{" "}
                    {observation.firstCollectedAt} - last seen{" "}
                    {observation.lastCollectedAt}
                  </p>
                  <p className="muted">
                    Seen {observation.seenCount} time
                    {observation.seenCount === 1 ? "" : "s"} -{" "}
                    {observation.evidenceCount} evidence snapshot
                    {observation.evidenceCount === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="actions">
          <Link
            className="button secondary"
            href={`/tenant/${tenantSlug}/workspaces/${workspaceId}/subscriptions`}
          >
            Manage subscriptions
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
