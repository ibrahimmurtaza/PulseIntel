import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/tenant-home/[tenantSlug]/route";
import { createSessionValue } from "@/lib/session";

function createRequest(cookieValue?: string) {
  const headers = new Headers();

  if (cookieValue) {
    headers.set("cookie", `pulseintel_session=${cookieValue}`);
  }

  return new NextRequest("http://localhost:3000/api/tenant-home/acme", {
    headers,
  });
}

describe("GET /api/tenant-home/[tenantSlug]", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await GET(createRequest(), {
      params: Promise.resolve({ tenantSlug: "acme" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "unauthenticated",
    });
  });

  it("returns only accessible workspaces for the signed-in user", async () => {
    const response = await GET(
      createRequest(
        createSessionValue({
          userId: "usr_anna",
          email: "anna@acme.test",
          name: "Anna Analyst",
        }),
      ),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      tenant: {
        slug: "acme",
      },
      workspaces: [
        {
          id: "ws_launch",
          role: "editor",
        },
        {
          id: "ws_pricing",
          role: "viewer",
        },
      ],
    });
    expect(payload.workspaces).toHaveLength(2);
    expect(payload.workspaces.map((workspace: { id: string }) => workspace.id)).not.toContain(
      "ws_strategy",
    );
  });

  it("rejects requests for tenants the user cannot access", async () => {
    const response = await GET(
      createRequest(
        createSessionValue({
          userId: "usr_liam",
          email: "liam@globex.test",
          name: "Liam External",
        }),
      ),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "unauthorized",
    });
  });
});
