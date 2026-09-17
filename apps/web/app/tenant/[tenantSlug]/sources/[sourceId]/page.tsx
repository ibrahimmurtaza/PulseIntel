import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  getTenantSource,
  listTenantSources,
} from "@/lib/tenant-home";

type TenantSourceDetailPageProps = {
  params: Promise<{
    tenantSlug: string;
    sourceId: string;
  }>;
  searchParams?: Promise<{
    collected?: string;
    duplicates?: string;
    error?: string;
  }>;
};

function describeError(error?: string) {
  switch (error) {
    case "items_required":
      return "Provide a JSON array of feed items to collect.";
    case "feed_item_required":
      return "Each feed item needs url, title, and publishedAt fields.";
    case "forbidden":
      return "Only tenant admins can collect sources.";
    case "source_not_found":
      return "That source could not be found in this tenant.";
    case "source_kind_unsupported":
      return "Manual sources are not collected automatically.";
    default:
      return undefined;
  }
}

export default async function TenantSourceDetailPage({
  params,
  searchParams,
}: TenantSourceDetailPageProps) {
  const { tenantSlug, sourceId } = await params;
  const query = (await searchParams) ?? {};
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(
        `/tenant/${tenantSlug}/sources/${sourceId}`,
      )}`,
    );
  }

  const source = getTenantSource(tenantSlug, sourceId, session.userId);

  if (!source) {
    redirect("/unauthorized");
  }

  const allSources = listTenantSources(tenantSlug, session.userId);
  const errorMessage = describeError(query.error);
  const collected = query.collected ? Number(query.collected) : 0;
  const duplicates = query.duplicates ? Number(query.duplicates) : 0;

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">{source.kind.toUpperCase()} source</span>
          <h1>{source.name}</h1>
          {source.kind === "rss" ? (
            <p className="muted">Feed URL: {source.feedUrl}</p>
          ) : source.description ? (
            <p className="muted">{source.description}</p>
          ) : (
            <p className="muted">
              Subscribed workspaces record observations here with a required
              citation note as provenance.
            </p>
          )}
          <p className="muted">Created {source.createdAt}</p>
        </div>

        {query.collected ? (
          <p className="notice">
            Collection finished: {collected} new observation
            {collected === 1 ? "" : "s"}, {duplicates} duplicate
            {duplicates === 1 ? "" : "s"} skipped.
          </p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {source.canManage && source.kind === "rss" ? (
          <form
            action={`/tenant/${tenantSlug}/sources/${source.id}/collect`}
            className="stack"
            method="post"
          >
            <h2>Simulate collection</h2>
            <p className="muted">
              Provide a JSON array of feed items. Each item needs a{" "}
              <code>url</code>, <code>title</code>, and <code>publishedAt</code>{" "}
              field. Items whose <code>url</code> already exists as an
              Article Identity are deduplicated.
            </p>
            <label className="field">
              <span>Items (JSON array)</span>
              <textarea
                name="items"
                required
                rows={8}
                placeholder={`[
  {
    "url": "https://example.com/article-1",
    "title": "Launch coverage hits a new high",
    "publishedAt": "2026-01-15T09:30:00.000Z"
  }
]`}
              />
            </label>
            <div className="actions">
              <button className="button" type="submit">
                Run collection
              </button>
              <Link
                className="button secondary"
                href={`/tenant/${tenantSlug}/sources`}
              >
                Back to sources
              </Link>
            </div>
          </form>
        ) : (
          <div className="actions">
            <Link
              className="button secondary"
              href={`/tenant/${tenantSlug}/sources`}
            >
              Back to sources
            </Link>
          </div>
        )}

        <div className="stack">
          <h2>All tenant sources</h2>
          <ul className="workspace-list">
            {allSources.map((entry) => (
              <li className="workspace-item stack" key={entry.id}>
                <div className="actions">
                  <strong>{entry.name}</strong>
                  <span className="pill">
                    {entry.id === source.id ? "Current" : entry.kind.toUpperCase()}
                  </span>
                </div>
                {entry.kind === "rss" ? (
                  <p className="muted">{entry.feedUrl}</p>
                ) : entry.description ? (
                  <p className="muted">{entry.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}