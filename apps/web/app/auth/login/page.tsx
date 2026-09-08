import Link from "next/link";

import { getAuthMode } from "@/lib/auth";
import { listDemoUsers } from "@/lib/tenant-home";

type LoginPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const returnTo = params.returnTo ?? "/tenant/acme";
  const authMode = getAuthMode();
  const demoUsers = listDemoUsers();

  return (
    <main className="shell">
      <div className="card stack">
        <div className="stack">
          <span className="pill">Sign In</span>
          <h1>Access your Tenant Home</h1>
          <p className="muted">
            {authMode === "auth0"
              ? "Use Auth0 to authenticate, then we will resolve your tenant memberships and send you to the requested Tenant Home."
              : "Stub mode is enabled for local development, so you can sign in as a seeded demo user without external credentials."}
          </p>
        </div>

        {authMode === "auth0" ? (
          <div className="actions">
            <Link
              className="button"
              href={`/auth/login/submit?returnTo=${encodeURIComponent(returnTo)}`}
            >
              Continue with Auth0
            </Link>
          </div>
        ) : (
          <div className="stack">
            {demoUsers.map((user) => (
              <div className="workspace-item stack" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <div className="muted">{user.email}</div>
                </div>
                <div className="actions">
                  <Link
                    className="button"
                    href={`/auth/login/submit?userId=${user.id}&returnTo=${encodeURIComponent(returnTo)}`}
                  >
                    Sign in as {user.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
