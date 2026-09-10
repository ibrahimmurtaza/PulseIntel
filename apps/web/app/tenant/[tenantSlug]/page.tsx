import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import { resolveTenantHome } from "@/lib/tenant-home";

type TenantHomePageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { tenantSlug } = await params;
  const session = await getSessionFromPage();

  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(`/tenant/${tenantSlug}`)}`);
  }

  const tenantHome = resolveTenantHome(tenantSlug, session.userId);

  if (!tenantHome) {
    redirect("/unauthorized");
  }

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Tenant Home</span>
          <h1>{tenantHome.tenant.name}</h1>
          <p className="muted">
            Signed in as {session.name}. Your tenant role is{" "}
            {tenantHome.tenantRole}. Only workspaces available through your
            memberships are listed here.
          </p>
        </div>
        <ul className="workspace-list">
          {tenantHome.workspaces.map((workspace) => (
            <li className="workspace-item stack" key={workspace.id}>
              <div className="actions">
                <strong>{workspace.name}</strong>
                <span className="pill">{workspace.role}</span>
              </div>
              <p className="muted">{workspace.description}</p>
              <div className="actions">
                <Link
                  className="button secondary"
                  href={`/tenant/${tenantSlug}/workspaces/${workspace.id}`}
                >
                  Open workspace
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <div className="actions">
          {(tenantHome.tenantRole === "admin" ||
            tenantHome.tenantRole === "owner") && (
            <>
              <Link
                className="button"
                href={`/tenant/${tenantSlug}/workspaces`}
              >
                Manage workspaces
              </Link>
              <Link
                className="button"
                href={`/tenant/${tenantSlug}/invitations`}
              >
                Manage invitations
              </Link>
            </>
          )}
          <Link className="button secondary" href="/auth/logout">
            Sign out
          </Link>
        </div>
      </div>
    </main>
  );
}
