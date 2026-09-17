import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  canManageWorkspaceObservations,
  listWorkspaceObservations,
  listWorkspaceSources,
  resolveWorkspace,
} from "@/lib/tenant-home";

type WorkspaceObservationsPageProps = {
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
    case "title_required":
      return "Each observation needs a title.";
    case "published_at_required":
      return "Each observation needs a published date.";
    case "published_at_invalid":
      return "Provide a published date as an ISO date (YYYY-MM-DD) or full ISO timestamp.";
    case "citation_note_required":
      return "Manual observations require a citation note for provenance.";
    case "article_url_invalid":
      return "Provide a valid http(s) URL when supplying an article link.";
    case "source_not_subscribed":
      return "Subscribe this workspace to the chosen source before recording.";
    case "source_kind_unsupported":
      return "Manual observations can only be recorded on manual sources.";
    case "source_not_found":
      return "That source could not be found in this tenant.";
    case "workspace_not_found":
      return "This workspace could not be found in this tenant.";
    case "forbidden":
      return "Only workspace editors and admins can record observations.";
    default:
      return undefined;
  }
}

export default async function WorkspaceObservationsPage({
  params,
  searchParams,
}: WorkspaceObservationsPageProps) {
  const { tenantSlug, workspaceId } = await params;
  const query = (await searchParams) ?? {};
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
  const subscribedSources = listWorkspaceSources(
    tenantSlug,
    workspaceId,
    session.userId,
  );
  const manualSources = subscribedSources.filter(
    (source) => source.kind === "manual",
  );
  const canRecord = canManageWorkspaceObservations(
    tenantSlug,
    workspaceId,
    session.userId,
  );
  const errorMessage = describeError(query.error);

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
            subscribed to. RSS items with an Article Identity are deduplicated
            across collections. Manual observations always include the
            contributor's citation note as provenance.
          </p>
        </div>

        {query.created ? (
          <p className="notice">
            Observation {query.created} was recorded.
          </p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {canRecord ? (
          <form
            action={`/tenant/${tenantSlug}/workspaces/${workspaceId}/observations/create`}
            className="stack"
            method="post"
          >
            <h2>Record a manual observation</h2>
            <p className="muted">
              Manual observations always carry a citation note explaining
              where the value came from. Choose a subscribed manual source.
            </p>
            {manualSources.length === 0 ? (
              <p className="muted">
                This workspace is not subscribed to any manual sources yet.
                Ask a workspace admin to attach one.
              </p>
            ) : (
              <>
                <div className="field-grid">
                  <label className="field">
                    <span>Source</span>
                    <select name="sourceId" required defaultValue="">
                      <option value="" disabled>
                        Choose a manual source
                      </option>
                      {manualSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input name="title" required type="text" />
                  </label>
                  <label className="field">
                    <span>Published at</span>
                    <input
                      name="publishedAt"
                      placeholder="2026-01-15"
                      required
                      type="text"
                    />
                  </label>
                  <label className="field">
                    <span>Article URL (optional)</span>
                    <input
                      name="articleUrl"
                      placeholder="https://example.com/article"
                      type="url"
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Citation note (provenance)</span>
                  <textarea
                    name="citationNote"
                    required
                    placeholder="Where did this value come from? Include enough detail for others to verify."
                    rows={3}
                  />
                </label>
                <div className="actions">
                  <button className="button" type="submit">
                    Record observation
                  </button>
                </div>
              </>
            )}
          </form>
        ) : null}

        <div className="stack">
          <h2>Collected observations</h2>
          {observations.length === 0 ? (
            <p className="muted">
              No observations collected yet. Ask a tenant admin to run a
              collection on a subscribed source, or record a manual
              observation above.
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
                    <span className="pill">
                      {observation.sourceKind.toUpperCase()}
                    </span>
                  </div>
                  {observation.articleUrl ? (
                    <p className="muted">
                      Article:{" "}
                      <a
                        href={observation.articleUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {observation.articleUrl}
                      </a>
                    </p>
                  ) : null}
                  <p className="muted">
                    Published {observation.publishedAt} - collected{" "}
                    {observation.collectedAt}
                  </p>
                  {observation.citationNote ? (
                    <p className="muted">
                      <strong>Citation note:</strong>{" "}
                      {observation.citationNote}
                    </p>
                  ) : null}
                  {observation.evidenceCount > 0 ? (
                    <p className="muted">
                      {observation.evidenceCount} evidence snapshot
                      {observation.evidenceCount === 1 ? "" : "s"} (
                      {observation.citationNote
                        ? "manual citation captured alongside Article Identity"
                        : "Article Identity preserved"}
                      ).
                    </p>
                  ) : null}
                  {observation.citationNote && observation.evidenceCount === 0 ? (
                    <p className="muted">
                      Manual citation captured — no article link supplied.
                    </p>
                  ) : null}
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