import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import { resolveWorkspace } from "@/lib/tenant-home";

type WorkspaceDetailPageProps = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

export default async function WorkspaceDetailPage({
  params,
}: WorkspaceDetailPageProps) {
  const { tenantSlug, workspaceId } = await params;
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}`,
      )}`,
    );
  }

  const workspace = resolveWorkspace(tenantSlug, workspaceId, session.userId);

  if (!workspace) {
    redirect("/unauthorized");
  }

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Workspace</span>
          <h1>{workspace.name}</h1>
          <p className="muted">
            Tenant: {workspace.tenant.name} - Your role: {workspace.role}
          </p>
          <p>{workspace.description || "No description provided."}</p>
        </div>

        <div className="stack">
          <h2>Members</h2>
          <p className="muted">Members in this workspace: {workspace.memberCount}</p>
        </div>

        <div className="actions">
          <Link className="button secondary" href={`/tenant/${tenantSlug}/workspaces`}>
            Back to workspaces
          </Link>
          <Link className="button secondary" href={`/tenant/${tenantSlug}`}>
            Back to Tenant Home
          </Link>
        </div>
      </div>
    </main>
  );
}
