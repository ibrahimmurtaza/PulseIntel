import Link from "next/link";

import { getSessionFromPage } from "@/lib/request-auth";

export default async function HomePage() {
  const session = await getSessionFromPage();

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">PulseIntel</span>
          <h1>Auth0 sign-in and Tenant Home baseline</h1>
          <p className="muted">
            This first ticket establishes sign-in, tenant membership resolution,
            and a Tenant Home that only shows accessible Workspaces.
          </p>
        </div>
        <div className="actions">
          {session ? (
            <>
              <Link className="button" href="/tenant/acme">
                Open Acme Tenant Home
              </Link>
              <Link className="button secondary" href="/auth/logout">
                Sign out
              </Link>
            </>
          ) : (
            <Link className="button" href="/auth/login?returnTo=%2Ftenant%2Facme">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
