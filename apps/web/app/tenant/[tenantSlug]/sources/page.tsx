import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  canManageTenantSources,
  getTenantBySlug,
  listTenantSources,
} from "@/lib/tenant-home";

type TenantSourcesPageProps = {
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
      return "Source name is required.";
    case "feed_url_required":
      return "Provide a valid http(s) feed URL.";
    case "source_already_exists":
      return "A source with that name already exists in this tenant.";
    case "source_feed_already_registered":
      return "A source already uses that feed URL in this tenant.";
    case "forbidden":
      return "Only tenant admins can manage sources.";
    default:
      return undefined;
  }
}

export default async function TenantSourcesPage({
  params,
  searchParams,
}: TenantSourcesPageProps) {
  const { tenantSlug } = await params;
  const query = (await searchParams) ?? {};
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(`/tenant/${tenantSlug}/sources`)}`,
    );
  }

  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    redirect("/unauthorized");
  }

  const canManage = canManageTenantSources(tenantSlug, session.userId);
  const sources = listTenantSources(tenantSlug, session.userId);
  const errorMessage = describeError(query.error);

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Sources</span>
          <h1>{tenant.name}</h1>
          <p className="muted">
            Tenant-owned sources feed observations into the workspaces that
            subscribe to them. Tenant admins define each source once.
          </p>
        </div>

        {query.created ? (
          <p className="notice">Source {query.created} was created.</p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {canManage ? (
          <form
            action={`/tenant/${tenantSlug}/sources/create`}
            className="stack"
            method="post"
          >
            <div className="field-grid">
              <label className="field">
                <span>Name</span>
                <input name="name" required type="text" />
              </label>
              <label className="field">
                <span>Feed URL</span>
                <input
                  name="feedUrl"
                  placeholder="https://example.com/feed.xml"
                  required
                  type="url"
                />
              </label>
            </div>
            <div className="actions">
              <button className="button" type="submit">
                Create RSS source
              </button>
            </div>
          </form>
        ) : null}

        <div className="stack">
          <h2>Tenant sources</h2>
          {sources.length === 0 ? (
            <p className="muted">
              No sources defined yet for this tenant.
              {canManage ? " Use the form above to register an RSS feed." : ""}
            </p>
          ) : (
            <ul className="workspace-list">
              {sources.map((source) => (
                <li className="workspace-item stack" key={source.id}>
                  <div className="actions">
                    <strong>{source.name}</strong>
                    <span className="pill">{source.kind.toUpperCase()}</span>
                  </div>
                  <p className="muted">{source.feedUrl}</p>
                  <div className="actions">
                    <Link
                      className="button secondary"
                      href={`/tenant/${tenantSlug}/sources/${source.id}`}
                    >
                      Open source
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="actions">
          <Link className="button secondary" href={`/tenant/${tenantSlug}`}>
            Back to Tenant Home
          </Link>
        </div>
      </div>
    </main>
  );
}
