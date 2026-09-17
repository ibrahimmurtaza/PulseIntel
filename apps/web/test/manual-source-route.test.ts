import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { POST as createSource } from "@/app/api/tenant/[tenantSlug]/sources/route";
import {
  POST as collectSource,
} from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/collect/route";
import {
  GET as listObservations,
  POST as createObservation,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/observations/route";
import {
  POST as createSubscription,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/subscriptions/route";
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

const VIEWER_COOKIE = createSessionCookie({
  userId: "usr_anna",
  email: "anna@acme.test",
  name: "Anna Analyst",
});

async function createManualSource(input?: { name?: string; description?: string }) {
  const response = await createSource(
    createJsonRequest({
      url: "http://localhost:3000/api/tenant/acme/sources",
      cookie: ADMIN_COOKIE,
      body: {
        kind: "manual",
        name: input?.name ?? "Competitor PR mentions",
        description: input?.description ?? "Manual notes from PR team",
      },
    }),
    {
      params: Promise.resolve({ tenantSlug: "acme" }),
    },
  );

  const payload = (await response.json()) as { source: { id: string } };
  return payload.source.id;
}

describe("Manual source routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  describe("POST /api/tenant/[tenantSlug]/sources (manual kind)", () => {
    it("rejects non-admin tenant members", async () => {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: EDITOR_COOKIE,
          body: { kind: "manual", name: "Acme notes" },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    });

    it("lets a tenant admin create a manual source", async () => {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: ADMIN_COOKIE,
          body: {
            kind: "manual",
            name: "Competitor PR mentions",
            description: "PR team notes about competitor launches",
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
        name: "Competitor PR mentions",
        kind: "manual",
        description: "PR team notes about competitor launches",
        feedUrl: "",
        canManage: true,
      });
    });

    it("rejects a missing name", async () => {
      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: ADMIN_COOKIE,
          body: { kind: "manual", name: "  " },
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

    it("rejects duplicate names across kinds within the same tenant", async () => {
      await createManualSource({ name: "Shared notes" });

      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: ADMIN_COOKIE,
          body: {
            kind: "rss",
            name: "Shared notes",
            feedUrl: "https://example.com/shared.xml",
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

    it("rejects duplicate names across kinds the other way", async () => {
      await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: ADMIN_COOKIE,
          body: {
            kind: "rss",
            name: "Shared notes",
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
          cookie: ADMIN_COOKIE,
          body: { kind: "manual", name: "Shared notes" },
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

    it("allows the same source name in a different tenant", async () => {
      await createManualSource({ name: "Local notes" });

      const response = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/globex/sources",
          cookie: createSessionCookie({
            userId: "usr_liam",
            email: "liam@globex.test",
            name: "Liam External",
          }),
          body: { kind: "manual", name: "Local notes" },
        }),
        {
          params: Promise.resolve({ tenantSlug: "globex" }),
        },
      );

      expect(response.status).toBe(201);
    });
  });

  describe("POST /api/tenant/[tenantSlug]/sources/[sourceId]/collect on a manual source", () => {
    it("rejects collection against a manual source", async () => {
      const sourceId = await createManualSource();

      const response = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: ADMIN_COOKIE,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Manual entry",
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

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "source_kind_unsupported",
      });
    });
  });

  describe("POST /api/tenant/[tenantSlug]/workspaces/[workspaceId]/observations (manual)", () => {
    async function subscribeWorkspaceToManualSource(
      workspaceId: string,
      sourceId: string,
    ) {
      const response = await createSubscription(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/${workspaceId}/subscriptions`,
          cookie: ADMIN_COOKIE,
          body: { sourceId },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId,
          }),
        },
      );

      expect(response.status).toBe(201);
    }

    it("lets a workspace editor record a manual observation with a citation note", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Competitor announces v2 launch",
            publishedAt: "2026-02-10",
            citationNote:
              "PR team Slack on 2026-02-09 confirming the launch plan.",
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
      expect(payload.observation).toMatchObject({
        title: "Competitor announces v2 launch",
        publishedAt: "2026-02-10",
        sourceId,
        sourceKind: "manual",
        sourceName: "Competitor PR mentions",
        articleUrl: "",
        citationNote:
          "PR team Slack on 2026-02-09 confirming the launch plan.",
        evidenceCount: 0,
      });
    });

    it("captures an evidence snapshot when an article URL is supplied", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Competitor announces v2 launch",
            publishedAt: "2026-02-10",
            citationNote: "PR team Slack on 2026-02-09.",
            articleUrl: "https://example.com/competitor-launch",
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
      expect(payload.observation).toMatchObject({
        articleUrl: "https://example.com/competitor-launch",
        evidenceCount: 1,
      });
    });

    it("rejects a non-ISO published date", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Note",
            publishedAt: "next Tuesday",
            citationNote: "Some context.",
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
        error: "published_at_invalid",
      });
    });

    it("accepts a full ISO timestamp as published date", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Note",
            publishedAt: "2026-02-10T09:30:00.000Z",
            citationNote: "Some context.",
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
      expect(payload.observation.publishedAt).toBe("2026-02-10T09:30:00.000Z");
    });

    it("lets a workspace admin record a manual observation", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: ADMIN_COOKIE,
          body: {
            sourceId,
            title: "Manual note",
            publishedAt: "2026-02-10",
            citationNote: "Confirmed in standup.",
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
    });

    it("rejects viewers from recording manual observations", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_pricing", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/observations",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            sourceId,
            title: "Note",
            publishedAt: "2026-02-10",
            citationNote: "Should fail because Anna is a viewer here.",
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_pricing",
          }),
        },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    });

    it("rejects a missing citation note", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Manual entry",
            publishedAt: "2026-02-10",
            citationNote: "   ",
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
        error: "citation_note_required",
      });
    });

    it("rejects a missing title", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "  ",
            publishedAt: "2026-02-10",
            citationNote: "Some context.",
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
        error: "title_required",
      });
    });

    it("rejects an invalid article URL", async () => {
      const sourceId = await createManualSource();
      await subscribeWorkspaceToManualSource("ws_launch", sourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Note",
            publishedAt: "2026-02-10",
            citationNote: "Some context.",
            articleUrl: "not-a-url",
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
        error: "article_url_invalid",
      });
    });

    it("rejects when the workspace is not subscribed to the manual source", async () => {
      const sourceId = await createManualSource();

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Note",
            publishedAt: "2026-02-10",
            citationNote: "Some context.",
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
        error: "source_not_subscribed",
      });
    });

    it("rejects manual observations against an RSS source", async () => {
      const sourceId = await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: ADMIN_COOKIE,
          body: {
            kind: "rss",
            name: "RSS only",
            feedUrl: "https://example.com/feed.xml",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );
      const payload = (await sourceId.json()) as { source: { id: string } };
      const rssSourceId = payload.source.id;
      await subscribeWorkspaceToManualSource("ws_launch", rssSourceId);

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId: rssSourceId,
            title: "Manual against RSS",
            publishedAt: "2026-02-10",
            citationNote: "Should fail.",
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
        error: "source_kind_unsupported",
      });
    });

    it("rejects unknown source ids", async () => {
      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId: "src_missing",
            title: "Note",
            publishedAt: "2026-02-10",
            citationNote: "Some context.",
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "source_not_found",
      });
    });

    it("rejects sources belonging to another tenant", async () => {
      await createSource(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/globex/sources",
          cookie: createSessionCookie({
            userId: "usr_liam",
            email: "liam@globex.test",
            name: "Liam External",
          }),
          body: {
            kind: "manual",
            name: "Globex notes",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "globex" }),
        },
      );

      const response = await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId: "src_1",
            title: "Note",
            publishedAt: "2026-02-10",
            citationNote: "Some context.",
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "source_not_found",
      });
    });
  });

  describe("GET /api/tenant/[tenantSlug]/workspaces/[workspaceId]/observations with manual observations", () => {
    it("returns manual observations with the citation note shown as provenance", async () => {
      const sourceId = await createManualSource({ name: "PR notes" });
      await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: { sourceId },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Competitor announces v2 launch",
            publishedAt: "2026-02-10",
            citationNote: "PR team Slack on 2026-02-09.",
            articleUrl: "https://example.com/competitor-launch",
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      const response = await listObservations(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: VIEWER_COOKIE,
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
        title: "Competitor announces v2 launch",
        sourceKind: "manual",
        sourceName: "PR notes",
        citationNote: "PR team Slack on 2026-02-09.",
        articleUrl: "https://example.com/competitor-launch",
        evidenceCount: 1,
      });
    });

    it("does not show manual observations to a workspace that has not subscribed", async () => {
      const sourceId = await createManualSource();
      await createSubscription(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/subscriptions",
          cookie: ADMIN_COOKIE,
          body: { sourceId },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      await createObservation(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/observations",
          cookie: EDITOR_COOKIE,
          body: {
            sourceId,
            title: "Note",
            publishedAt: "2026-02-10",
            citationNote: "Some context.",
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      const response = await listObservations(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/observations",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
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
  });
});