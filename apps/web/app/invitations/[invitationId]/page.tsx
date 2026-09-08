import Link from "next/link";

import { getInvitationById } from "@/lib/tenant-home";

type InvitationPageProps = {
  params: Promise<{
    invitationId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

function describeError(error?: string) {
  switch (error) {
    case "invitation_email_mismatch":
      return "This invitation belongs to a different email address.";
    case "invitation_not_pending":
      return "This invitation has already been accepted.";
    default:
      return undefined;
  }
}

export default async function InvitationPage({
  params,
  searchParams,
}: InvitationPageProps) {
  const { invitationId } = await params;
  const query = (await searchParams) ?? {};
  const invitation = getInvitationById(invitationId);
  const errorMessage = describeError(query.error);

  if (!invitation) {
    return (
      <main className="shell">
        <div className="card stack">
          <span className="pill">Invitation</span>
          <h1>Invitation not found</h1>
          <p className="muted">
            The invitation link may be invalid or no longer available.
          </p>
          <Link className="button secondary" href="/">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Invitation</span>
          <h1>Join {invitation.tenantName}</h1>
          <p className="muted">
            {invitation.email} has been invited with tenant role{" "}
            {invitation.tenantRole}.
            {invitation.workspace && invitation.workspaceRole
              ? ` Initial workspace: ${invitation.workspace.name} (${invitation.workspaceRole}).`
              : ""}
          </p>
        </div>

        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        <div className="actions">
          {invitation.status === "pending" ? (
            <form action={`/invitations/${invitation.id}/accept`} method="post">
              <button className="button" type="submit">
                Accept invitation
              </button>
            </form>
          ) : (
            <Link className="button" href={`/tenant/${invitation.tenantSlug}`}>
              Open Tenant Home
            </Link>
          )}
          <Link className="button secondary" href="/">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
