import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { POST as createSource } from "@/app/api/tenant/[tenantSlug]/sources/route";
import {
  POST as collectSource,
} from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/collect/route";
import {
  GET as getSource,
} from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/route";
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

describe("Tenant RSS source routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  describe("POST /api/tenant/[tenantSlug]/sources", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          body: {
            name: "Launch coverage",
            feedUrl: "https://example.com/feed.xml",
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

    it("rejects tenant members without admin access", async () => {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            name: "Anna feed",
            feedUrl: "https://example.com/anna.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    });

    it("lets a tenant admin create an RSS source", async () => {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            name: "Launch coverage",
            feedUrl: "https://example.com/launch.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(201);
      const payload = await response.json();
      expect(payload.source).toMatchObject({
        tenantSlug: "acme",
        name: "Launch coverage",
        feedUrl: "https://example.com/launch.xml",
        kind: "rss",
        canManage: true,
      });
    });

    it("rejects missing feed URLs", async () => {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            name: "Bad URL",
            feedUrl: "not-a-url",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "feed_url_required",
      });
    });

    it("rejects duplicate source names within a tenant", async () => {
      const cookie = createSessionCookie({
        userId: "usr_maya",
        email: "maya@acme.test",
        name: "Maya Market Lead",
      });

      await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie,
          body: {
            name: "Launch coverage",
            feedUrl: "https://example.com/launch.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie,
          body: {
            name: "Launch coverage",
            feedUrl: "https://example.com/other.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "source_already_exists",
      });
    });

    it("rejects duplicate feed URLs within a tenant", async () => {
      const cookie = createSessionCookie({
        userId: "usr_maya",
        email: "maya@acme.test",
        name: "Maya Market Lead",
      });

      await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie,
          body: {
            name: "First feed",
            feedUrl: "https://example.com/shared.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie,
          body: {
            name: "Second feed",
            feedUrl: "https://example.com/shared.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "source_feed_already_registered",
      });
    });
  });

  describe("GET /api/tenant/[tenantSlug]/sources/[sourceId]", () => {
    async function createLaunchSource() {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
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

    it("returns 404 for unknown sources", async () => {
      const response = await getSource(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/sources/src_missing",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            sourceId: "src_missing",
          }),
        },
      );

      expect(response.status).toBe(404);
    });

    it("returns the source to tenant members", async () => {
      const sourceId = await createLaunchSource();

      const response = await getSource(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            sourceId,
          }),
        },
      );

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.source).toMatchObject({
        id: sourceId,
        name: "Launch coverage",
        feedUrl: "https://example.com/launch.xml",
        kind: "rss",
        canManage: false,
      });
    });

    it("rejects sources from another tenant", async () => {
      const sourceId = await createLaunchSource();

      const response = await getSource(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/globex/sources/${sourceId}`,
          cookie: createSessionCookie({
            userId: "usr_liam",
            email: "liam@globex.test",
            name: "Liam External",
          }),
        }),
        {
          params: Promise.resolve({
            tenantSlug: "globex",
            sourceId,
          }),
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/tenant/[tenantSlug]/sources/[sourceId]/collect", () => {
    async function createLaunchSource() {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
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

    it("rejects unauthenticated collection runs", async () => {
      const sourceId = await createLaunchSource();

      const response = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Launch coverage hits a new high",
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

      expect(response.status).toBe(401);
    });

    it("creates observations with article identity and evidence", async () => {
      const sourceId = await createLaunchSource();

      const response = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Launch coverage hits a new high",
                publishedAt: "2026-01-15T09:30:00.000Z",
              },
              {
                url: "https://example.com/article-2",
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

      expect(response.status).toBe(201);
      const payload = await response.json();
      expect(payload.created).toBe(2);
      expect(payload.duplicates).toBe(0);
      expect(payload.observations).toHaveLength(2);
      expect(payload.observations[0]).toMatchObject({
        sourceId,
        articleUrl: "https://example.com/article-1",
        title: "Launch coverage hits a new high",
        evidenceCount: 1,
      });
      expect(payload.observations[0].collectedAt).toBeTruthy();
    });

    it("deduplicates observations by article identity across collections", async () => {
      const sourceId = await createLaunchSource();
      const cookie = createSessionCookie({
        userId: "usr_maya",
        email: "maya@acme.test",
        name: "Maya Market Lead",
      });

      const first = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Launch coverage hits a new high",
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

      expect(first.status).toBe(201);
      await expect(first.json()).resolves.toMatchObject({
        created: 1,
        duplicates: 0,
      });

      const second = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Launch coverage hits a new high (updated)",
                publishedAt: "2026-01-15T09:30:00.000Z",
              },
              {
                url: "https://example.com/article-2",
                title: "New article",
                publishedAt: "2026-01-17T08:00:00.000Z",
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

      expect(second.status).toBe(201);
      await expect(second.json()).resolves.toMatchObject({
        created: 1,
        duplicates: 1,
      });
    });

    it("does not mutate observations already recorded for an article identity", async () => {
      const sourceId = await createLaunchSource();
      const cookie = createSessionCookie({
        userId: "usr_maya",
        email: "maya@acme.test",
        name: "Maya Market Lead",
      });

      const originalTitle = "Launch coverage hits a new high";
      const originalPublishedAt = "2026-01-15T09:30:00.000Z";

      const first = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: originalTitle,
                publishedAt: originalPublishedAt,
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

      const firstPayload = (await first.json()) as {
        observations: Array<{
          id: string;
          title: string;
          publishedAt: string;
          collectedAt: string;
        }>;
      };

      const original = firstPayload.observations[0];

      const second = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Refreshed headline",
                publishedAt: "2026-01-18T10:00:00.000Z",
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

      expect(second.status).toBe(201);
      await expect(second.json()).resolves.toMatchObject({
        created: 0,
        duplicates: 1,
        observations: [],
      });

      expect(original.title).toBe(originalTitle);
      expect(original.publishedAt).toBe(originalPublishedAt);
    });

    it("rejects items that are not an array", async () => {
      const sourceId = await createLaunchSource();

      const response = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: { items: "not-an-array" },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            sourceId,
          }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "items_required",
      });
    });

    it("rejects malformed feed items", async () => {
      const sourceId = await createLaunchSource();

      const response = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "missing publishedAt",
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

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "feed_item_required",
      });
    });
  });
});
