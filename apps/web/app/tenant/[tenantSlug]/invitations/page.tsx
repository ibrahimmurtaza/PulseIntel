import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromPage } from "@/lib/request-auth";
import {
  canManageTenantInvitations,
  getTenantBySlug,
  listTenantInvitations,
  listTenantWorkspaces,
} from "@/lib/tenant-home";

type TenantInvitationsPageProps = {
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
    case "email_required":
      return "Email is required before an invitation can be created.";
    case "workspace_role_required":
      return "Choose a workspace role when you assign an initial workspace.";
    case "workspace_id_required":
      return "Pick a workspace before you attach a workspace role.";
    case "workspace_not_found":
      return "The selected workspace does not belong to this tenant.";
    case "forbidden":
      return "Only tenant admins can send invitations.";
    default:
      return undefined;
  }
}

export default async function TenantInvitationsPage({
  params,
  searchParams,
}: TenantInvitationsPageProps) {
  const { tenantSlug } = await params;
  const query = (await searchParams) ?? {};
  const session = await getSessionFromPage();

  if (!session) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(`/tenant/${tenantSlug}/invitations`)}`,
    );
  }

  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant || !canManageTenantInvitations(tenantSlug, session.userId)) {
    redirect("/unauthorized");
  }

  const workspaces = listTenantWorkspaces(tenantSlug);
  const invitations = listTenantInvitations(tenantSlug);
  const errorMessage = describeError(query.error);

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Invitations</span>
          <h1>{tenant.name}</h1>
          <p className="muted">
            Send invitations with a tenant role and, when helpful, an initial
            workspace membership.
          </p>
        </div>

        {query.created ? (
          <p className="notice">Invitation {query.created} is ready to share.</p>
        ) : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        <form
          action={`/tenant/${tenantSlug}/invitations/create`}
          className="stack"
          method="post"
        >
          <div className="field-grid">
            <label className="field">
              <span>Email</span>
              <input name="email" required type="email" />
            </label>
            <label className="field">
              <span>Name</span>
              <input name="invitedName" placeholder="Optional display name" />
            </label>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Tenant role</span>
              <select defaultValue="member" name="tenantRole">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <label className="field">
              <span>Initial workspace</span>
              <select defaultValue="" name="workspaceId">
                <option value="">No initial workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Workspace role</span>
              <select defaultValue="" name="workspaceRole">
                <option value="">No workspace role</option>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          <div className="actions">
            <button className="button" type="submit">
              Create invitation
            </button>
            <Link className="button secondary" href={`/tenant/${tenantSlug}`}>
              Back to Tenant Home
            </Link>
          </div>
        </form>

        <div className="stack">
          <h2>Pending and accepted invitations</h2>
          {invitations.length === 0 ? (
            <p className="muted">No invitations have been created yet.</p>
          ) : (
            <ul className="workspace-list">
              {invitations.map((invitation) => (
                <li className="workspace-item stack" key={invitation.id}>
                  <div className="actions">
                    <strong>{invitation.email}</strong>
                    <span className="pill">{invitation.status}</span>
                  </div>
                  <p className="muted">
                    Tenant role: {invitation.tenantRole}
                    {invitation.workspace && invitation.workspaceRole
                      ? ` | ${invitation.workspace.name}: ${invitation.workspaceRole}`
                      : ""}
                  </p>
                  <div className="actions">
                    <Link className="button secondary" href={invitation.acceptPath}>
                      Open invite
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
