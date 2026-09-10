import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { GET as getWorkspace } from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/route";
import {
  GET as listWorkspaces,
  POST as createWorkspace,
} from "@/app/api/tenant/[tenantSlug]/workspaces/route";
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
    method: input.body ? "POST" : "GET",
    headers,
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
}

function createGetRequest(input: { url: string; cookie?: string }) {
  const headers = new Headers();

  if (input.cookie) {
    headers.set("cookie", input.cookie);
  }

  return new NextRequest(input.url, { headers });
}

describe("Workspace routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  describe("GET /api/tenant/[tenantSlug]/workspaces", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await listWorkspaces(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
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

    it("lists all tenant workspaces for a tenant admin with canManage true", async () => {
      const response = await listWorkspaces(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.tenant).toMatchObject({ slug: "acme" });
      expect(payload.workspaces).toHaveLength(3);
      expect(payload.workspaces.every((w: { canManage: boolean }) => w.canManage)).toBe(true);
    });

    it("lists only accessible workspaces for non-admin members with canManage false", async () => {
      const response = await listWorkspaces(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.workspaces).toHaveLength(2);
      expect(payload.workspaces.every((w: { canManage: boolean }) => !w.canManage)).toBe(true);
    });
  });

  describe("POST /api/tenant/[tenantSlug]/workspaces", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await createWorkspace(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
          body: { name: "Brand New" },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(401);
    });

    it("rejects non-admin members", async () => {
      const response = await createWorkspace(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: { name: "Brand New" },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    });

    it("lets a tenant admin create a workspace and returns the view", async () => {
      const response = await createWorkspace(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            name: "Brand New",
            description: "Testing the new flow",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(201);
      const payload = await response.json();
      expect(payload.workspace).toMatchObject({
        tenantSlug: "acme",
        name: "Brand New",
        description: "Testing the new flow",
        memberCount: 1,
        canManage: true,
      });
    });

    it("rejects empty workspace names", async () => {
      const response = await createWorkspace(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: { name: "  " },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "name_required",
      });
    });

    it("rejects duplicate workspace names within the same tenant", async () => {
      const response = await createWorkspace(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: { name: "Launch Monitoring" },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "workspace_already_exists",
      });
    });
  });

  describe("GET /api/tenant/[tenantSlug]/workspaces/[workspaceId]", () => {
    it("returns the workspace for a member", async () => {
      const response = await getWorkspace(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.workspace).toMatchObject({
        id: "ws_launch",
        name: "Launch Monitoring",
        role: "editor",
        tenant: { slug: "acme" },
      });
    });

    it("rejects non-members even if they belong to the tenant", async () => {
      // usr_anna is a tenant member but not in ws_strategy
      const response = await getWorkspace(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_strategy",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_strategy",
          }),
        },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: "unauthorized",
      });
    });

    it("rejects users from a different tenant", async () => {
      const response = await getWorkspace(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch",
          cookie: createSessionCookie({
            userId: "usr_liam",
            email: "liam@globex.test",
            name: "Liam External",
          }),
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });
});
