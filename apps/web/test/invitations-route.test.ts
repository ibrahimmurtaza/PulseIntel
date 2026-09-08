import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { POST as acceptInvitation } from "@/app/api/invitations/[invitationId]/accept/route";
import { POST as createInvitation } from "@/app/api/tenant/[tenantSlug]/invitations/route";
import { GET as getTenantHome } from "@/app/api/tenant-home/[tenantSlug]/route";
import { createSessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { resetDemoTenantState } from "@/lib/tenant-home";

function createSessionCookie(input: {
  userId: string;
  email: string;
  name: string;
}) {
  return `${SESSION_COOKIE_NAME}=${createSessionValue(input)}`;
}

function createJsonRequest(input: {
  url: string;
  body?: Record<string, unknown>;
  cookie?: string;
}) {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (input.cookie) {
    headers.set("cookie", input.cookie);
  }

  return new NextRequest(input.url, {
    method: "POST",
    headers,
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
}

function createTenantHomeRequest(cookie?: string) {
  const headers = new Headers();

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return new NextRequest("http://localhost:3000/api/tenant-home/acme", {
    headers,
  });
}

function readCookiePair(setCookieHeader: string | null) {
  return setCookieHeader?.split(";")[0];
}

describe("Invitation routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  it("rejects invitation creation for unauthenticated requests", async () => {
    const response = await createInvitation(
      createJsonRequest({
        url: "http://localhost:3000/api/tenant/acme/invitations",
        body: {
          email: "new.user@acme.test",
          tenantRole: "member",
        },
      }),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "unauthenticated",
    });
  });

  it("rejects invitation creation for tenant members without admin access", async () => {
    const response = await createInvitation(
      createJsonRequest({
        url: "http://localhost:3000/api/tenant/acme/invitations",
        cookie: createSessionCookie({
          userId: "usr_anna",
          email: "anna@acme.test",
          name: "Anna Analyst",
        }),
        body: {
          email: "new.user@acme.test",
          tenantRole: "member",
        },
      }),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "forbidden",
    });
  });

  it("lets a tenant admin create an invitation with an initial workspace role", async () => {
    const response = await createInvitation(
      createJsonRequest({
        url: "http://localhost:3000/api/tenant/acme/invitations",
        cookie: createSessionCookie({
          userId: "usr_maya",
          email: "maya@acme.test",
          name: "Maya Market Lead",
        }),
        body: {
          email: "new.user@acme.test",
          invitedName: "Nora New",
          tenantRole: "member",
          workspaceId: "ws_launch",
          workspaceRole: "viewer",
        },
      }),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.invitation).toMatchObject({
      tenantSlug: "acme",
      email: "new.user@acme.test",
      tenantRole: "member",
      workspace: {
        id: "ws_launch",
        name: "Launch Monitoring",
      },
      workspaceRole: "viewer",
      status: "pending",
      acceptPath: expect.stringContaining("/invitations/inv_"),
    });
  });

  it("accepts an invitation and grants the invited memberships", async () => {
    const createResponse = await createInvitation(
      createJsonRequest({
        url: "http://localhost:3000/api/tenant/acme/invitations",
        cookie: createSessionCookie({
          userId: "usr_maya",
          email: "maya@acme.test",
          name: "Maya Market Lead",
        }),
        body: {
          email: "new.user@acme.test",
          invitedName: "Nora New",
          tenantRole: "member",
          workspaceId: "ws_launch",
          workspaceRole: "viewer",
        },
      }),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    const createPayload = await createResponse.json();
    const invitationId = createPayload.invitation.id as string;

    const acceptResponse = await acceptInvitation(
      createJsonRequest({
        url: `http://localhost:3000/api/invitations/${invitationId}/accept`,
      }),
      {
        params: Promise.resolve({ invitationId }),
      },
    );

    expect(acceptResponse.status).toBe(200);
    await expect(acceptResponse.json()).resolves.toMatchObject({
      invitation: {
        id: invitationId,
        status: "accepted",
      },
      redirectTo: "/tenant/acme",
    });

    const invitedCookie = readCookiePair(acceptResponse.headers.get("set-cookie"));

    expect(invitedCookie).toContain(`${SESSION_COOKIE_NAME}=`);

    const tenantHomeResponse = await getTenantHome(
      createTenantHomeRequest(invitedCookie),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    expect(tenantHomeResponse.status).toBe(200);
    const tenantHomePayload = await tenantHomeResponse.json();
    expect(tenantHomePayload).toMatchObject({
      tenant: {
        slug: "acme",
      },
      tenantRole: "member",
      workspaces: [
        {
          id: "ws_launch",
          role: "viewer",
        },
      ],
    });
    expect(tenantHomePayload.workspaces).toHaveLength(1);
  });
});
