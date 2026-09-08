import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="shell">
      <div className="card stack">
        <span className="pill">Unauthorized</span>
        <h1>You do not have access to this Tenant Home.</h1>
        <p className="muted">
          PulseIntel only shows workspaces that belong to your resolved tenant
          memberships.
        </p>
        <div className="actions">
          <Link className="button" href="/auth/login?returnTo=%2Ftenant%2Facme">
            Sign in again
          </Link>
          <Link className="button secondary" href="/">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
