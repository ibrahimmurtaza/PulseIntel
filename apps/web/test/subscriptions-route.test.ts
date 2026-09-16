import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { POST as createSource } from "@/app/api/tenant/[tenantSlug]/sources/route";
import { POST as collectSource } from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/collect/route";
import {
  POST as createSubscription,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/subscriptions/route";
import {
  GET as listObservations,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/observations/route";
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

const ADMIN_COOKIE = createSessionCookie({
  userId: "usr_maya",
  email: "maya@acme.test",
  name: "Maya Market Lead",
});

const EDITOR_COOKIE = createSessionCookie({
  userId: "usr_anna",
  email: "anna@acme.test",
  name: "Anna Analyst",
});

async function createLaunchSource() {
  const response = await createSource(
    createJsonRequest({
      url: "http://localhost:3000/api/tenant/acme/sources",
      cookie: ADMIN_COOKIE,
      body: {
        name: "Launch coverage",
        feedUrl: "https://example.com/launch.xml",
      },
    }),
    {
      params: Promise.resolve({ tenantSlug: "acme" }),
    },
  );

  const payload = (await response.json()) as { source: { id: string } };
  return payload.source.id;
}

describe("Workspace subscription routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  describe("POST /api/tenant/[tenantSlug]/workspaces/[workspaceId]/subscriptions", () => {
    it("lets a workspace admin attach a tenant source", async () => {
      const sourceId = await createLaunchSource();

      const response = await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId,
            keywords: ["launch"],
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(201);
      const payload = await response.json();
      expect(payload.subscription).toMatchObject({
        tenantSlug: "acme",
        workspaceId: "ws_launch",
        workspaceName: "Launch Monitoring",
        sourceId,
        sourceName: "Launch coverage",
        feedUrl: "https://example.com/launch.xml",
        filter: { keywords: ["launch"] },
      });
    });

    it("rejects non-admin workspace members", async () => {
      const sourceId = await createLaunchSource();

      const response = await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    });

    it("rejects unknown sources", async () => {
      const response = await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId: "src_missing",
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "source_not_found",
      });
    });

    it("rejects duplicate subscriptions on the same source", async () => {
      const sourceId = await createLaunchSource();

      await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId,
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      const response = await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId,
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "subscription_already_exists",
      });
    });

    it("rejects sources that belong to another tenant", async () => {
      await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/globex/sources",
          cookie: createSessionCookie({
            userId: "usr_liam",
            email: "liam@globex.test",
            name: "Liam External",
          }),
          body: {
            name: "Globex feed",
            feedUrl: "https://globex.example.com/feed.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "globex" }),
        },
      );

      const response = await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId: "src_1",
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "source_not_found",
      });
    });
  });

  describe("GET /api/tenant/[tenantSlug]/workspaces/[workspaceId]/observations", () => {
    it("filters observations by subscription keywords", async () => {
      const sourceId = await createLaunchSource();

      await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId,
            keywords: ["launch"],
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: ADMIN_COOKIE,
          body: {
            items: [
              {
                url: "https://example.com/article-launch",
                title: "Launch coverage hits a new high",
                publishedAt: "2026-01-15T09:30:00.000Z",
              },
              {
                url: "https://example.com/article-pricing",
                title: "Pricing rumors swirl",
                publishedAt: "2026-01-16T11:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            sourceId,
          }),
        },
      );

      const response = await listObservations(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
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
      expect(payload.observations).toHaveLength(1);
      expect(payload.observations[0]).toMatchObject({
        articleUrl: "https://example.com/article-launch",
        title: "Launch coverage hits a new high",
        evidenceCount: 1,
      });
    });

    it("shows all observations when the subscription has no keywords", async () => {
      const sourceId = await createLaunchSource();

      await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId,
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: ADMIN_COOKIE,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "First story",
                publishedAt: "2026-01-15T09:30:00.000Z",
              },
              {
                url: "https://example.com/article-2",
                title: "Second story",
                publishedAt: "2026-01-16T11:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            sourceId,
          }),
        },
      );

      const response = await listObservations(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
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
      expect(payload.observations).toHaveLength(2);
    });

    it("does not leak observations to non-subscribed workspaces", async () => {
      const sourceId = await createLaunchSource();

      await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId,
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: ADMIN_COOKIE,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Launch Monitoring only",
                publishedAt: "2026-01-15T09:30:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            sourceId,
          }),
        },
      );

      const response = await listObservations(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/observations",
          cookie: EDITOR_COOKIE,
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_pricing",
          }),
        },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ observations: [] });
    });

    it("rejects non-members", async () => {
      const response = await listObservations(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_strategy/observations",
          cookie: EDITOR_COOKIE,
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_strategy",
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });
});
