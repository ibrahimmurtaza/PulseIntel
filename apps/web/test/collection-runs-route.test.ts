import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { POST as createSource, GET as listSources } from "@/app/api/tenant/[tenantSlug]/sources/route";
import { POST as collectSource } from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/collect/route";
import { GET as getSource } from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/route";
import { GET as getRuns } from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/runs/route";
import { GET as getHealth } from "@/app/api/tenant/[tenantSlug]/sources/[sourceId]/health/route";
import { createSessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { resetDemoTenantState, type SourceHealthView, type CollectionRunView } from "@/lib/tenant-home";

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

describe("Collection runs and source health routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  async function createRssSource(): Promise<string> {
    const response = await createSource(
      createJsonRequest({
        url: "http://localhost:3000/api/tenant/acme/sources",
        cookie: createSessionCookie({
          userId: "usr_maya",
          email: "maya@acme.test",
          name: "Maya Market Lead",
        }),
        body: {
          name: "Acme RSS Source",
          kind: "rss",
          feedUrl: "https://example.com/feed.xml",
          description: "Test feed description",
        },
      }),
      {
        params: Promise.resolve({ tenantSlug: "acme" }),
      },
    );

    expect(response.status).toBe(201);
    const payload = (await response.json()) as { source: { id: string } };
    return payload.source.id;
  }

  const mayaCookie = createSessionCookie({
    userId: "usr_maya",
    email: "maya@acme.test",
    name: "Maya Market Lead",
  });

  const annaCookie = createSessionCookie({
    userId: "usr_anna",
    email: "anna@acme.test",
    name: "Anna Analyst",
  });

  const outsiderCookie = createSessionCookie({
    userId: "usr_liam",
    email: "liam@globex.test",
    name: "Liam External",
  });

  describe("POST /api/tenant/[tenantSlug]/sources/[sourceId]/collect", () => {
    it("creates a CollectionRun with outcome success on successful collection", async () => {
      const sourceId = await createRssSource();

      const response = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Article 1",
                publishedAt: "2026-02-01T10:00:00.000Z",
              },
              {
                url: "https://example.com/article-2",
                title: "Article 2",
                publishedAt: "2026-02-02T10:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as {
        created: number;
        duplicates: number;
        run: CollectionRunView;
      };

      expect(data.created).toBe(2);
      expect(data.duplicates).toBe(0);
      expect(data.run).toMatchObject({
        tenantSlug: "acme",
        sourceId,
        sourceName: "Acme RSS Source",
        outcome: "success",
        itemsCollected: 2,
        duplicatesSkipped: 0,
      });
      expect(data.run.id).toMatch(/^run_/);
      expect(data.run.startedAt).toBeDefined();
      expect(data.run.completedAt).toBeDefined();
    });

    it("records duplicate skips in CollectionRun", async () => {
      const sourceId = await createRssSource();

      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Article 1",
                publishedAt: "2026-02-01T10:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      const second = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Article 1 dup",
                publishedAt: "2026-02-01T10:00:00.000Z",
              },
              {
                url: "https://example.com/article-2",
                title: "Article 2 new",
                publishedAt: "2026-02-02T10:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(second.status).toBe(201);
      const data = (await second.json()) as { run: CollectionRunView };
      expect(data.run.itemsCollected).toBe(1);
      expect(data.run.duplicatesSkipped).toBe(1);
      expect(data.run.outcome).toBe("success");
    });

    it("creates a CollectionRun with outcome failure when collection fails", async () => {
      const sourceId = await createRssSource();

      const response = await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/bad-item",
                title: "Missing publishedAt",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "feed_item_required",
      });

      // Verify the failed collection run was recorded
      const runsResponse = await getRuns(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/runs`,
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(runsResponse.status).toBe(200);
      const runsData = (await runsResponse.json()) as { runs: CollectionRunView[] };
      expect(runsData.runs).toHaveLength(1);
      expect(runsData.runs[0]).toMatchObject({
        sourceId,
        outcome: "failure",
        itemsCollected: 0,
        duplicatesSkipped: 0,
        errorMessage: "feed_item_required",
      });
    });
  });

  describe("GET /api/tenant/[tenantSlug]/sources/[sourceId]/runs", () => {
    it("rejects unauthenticated requests", async () => {
      const sourceId = await createRssSource();

      const response = await getRuns(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/runs`,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "unauthenticated",
      });
    });

    it("rejects unauthorized users outside tenant", async () => {
      const sourceId = await createRssSource();

      const response = await getRuns(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/runs`,
          cookie: outsiderCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "source_not_found",
      });
    });

    it("returns empty runs for newly created source", async () => {
      const sourceId = await createRssSource();

      const response = await getRuns(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/runs`,
          cookie: annaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ runs: [] });
    });

    it("returns runs ordered newest first", async () => {
      const sourceId = await createRssSource();

      // First run: success
      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Article 1",
                publishedAt: "2026-02-01T10:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      // Second run: failure
      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: "not-an-array",
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      const response = await getRuns(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/runs`,
          cookie: annaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { runs: CollectionRunView[] };
      expect(data.runs).toHaveLength(2);
      expect(data.runs[0].outcome).toBe("failure");
      expect(data.runs[1].outcome).toBe("success");
    });
  });

  describe("GET /api/tenant/[tenantSlug]/sources/[sourceId]/health", () => {
    it("rejects unauthenticated requests", async () => {
      const sourceId = await createRssSource();

      const response = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "unauthenticated",
      });
    });

    it("rejects unauthorized users outside tenant", async () => {
      const sourceId = await createRssSource();

      const response = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
          cookie: outsiderCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "source_not_found",
      });
    });

    it("reports unknown health when source has no runs", async () => {
      const sourceId = await createRssSource();

      const response = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
          cookie: annaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        health: {
          sourceId,
          tenantSlug: "acme",
          status: "unknown",
          recentFailureCount: 0,
          totalRuns: 0,
        },
      });
    });

    it("transitions health: unknown -> healthy -> degraded -> failing -> healthy", async () => {
      const sourceId = await createRssSource();

      // 1. Initial health: unknown
      const initialHealth = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );
      const initialData = (await initialHealth.json()) as { health: SourceHealthView };
      expect(initialData.health.status).toBe("unknown");

      // 2. Successful collect -> healthy
      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Article 1",
                publishedAt: "2026-02-01T10:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      const healthyResponse = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );
      const healthyData = (await healthyResponse.json()) as { health: SourceHealthView };
      expect(healthyData.health.status).toBe("healthy");
      expect(healthyData.health.lastRunAt).toBeDefined();
      expect(healthyData.health.lastSuccessAt).toBeDefined();
      expect(healthyData.health.totalRuns).toBe(1);

      // 3. One failure after success -> degraded (most recent failed, but last 5 has a success)
      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: { items: "invalid" },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      const degradedResponse = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );
      const degradedData = (await degradedResponse.json()) as { health: SourceHealthView };
      expect(degradedData.health.status).toBe("degraded");
      expect(degradedData.health.recentFailureCount).toBe(1);
      expect(degradedData.health.totalRuns).toBe(2);

      // 4. 4 more failures (total 5 consecutive failures) -> failing
      for (let i = 0; i < 4; i++) {
        await collectSource(
          createJsonRequest({
            url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
            cookie: mayaCookie,
            body: { items: "invalid" },
          }),
          {
            params: Promise.resolve({ tenantSlug: "acme", sourceId }),
          },
        );
      }

      const failingResponse = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );
      const failingData = (await failingResponse.json()) as { health: SourceHealthView };
      expect(failingData.health.status).toBe("failing");
      expect(failingData.health.recentFailureCount).toBe(5);
      expect(failingData.health.totalRuns).toBe(6);

      // 5. Recovery: new successful collect -> healthy
      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/article-recovery",
                title: "Article Recovery",
                publishedAt: "2026-02-05T10:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      const recoveredResponse = await getHealth(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/health`,
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );
      const recoveredData = (await recoveredResponse.json()) as { health: SourceHealthView };
      expect(recoveredData.health.status).toBe("healthy");
    });
  });

  describe("SourceView health field integration", () => {
    it("includes health status in GET /sources and GET /sources/[sourceId]", async () => {
      const sourceId = await createRssSource();

      // Check single source GET
      const singleResponse = await getSource(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}`,
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );
      expect(singleResponse.status).toBe(200);
      const singleData = (await singleResponse.json()) as { source: { health: string } };
      expect(singleData.source.health).toBe("unknown");

      // Collect successfully
      await collectSource(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/sources/${sourceId}/collect`,
          cookie: mayaCookie,
          body: {
            items: [
              {
                url: "https://example.com/article-1",
                title: "Article 1",
                publishedAt: "2026-02-01T10:00:00.000Z",
              },
            ],
          },
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme", sourceId }),
        },
      );

      // Check list sources GET reflects healthy
      const listResponse = await listSources(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/sources",
          cookie: mayaCookie,
        }),
        {
          params: Promise.resolve({ tenantSlug: "acme" }),
        },
      );
      expect(listResponse.status).toBe(200);
      const listData = (await listResponse.json()) as { sources: Array<{ id: string; health: string }> };
      const matching = listData.sources.find((s) => s.id === sourceId);
      expect(matching?.health).toBe("healthy");
    });
  });
});
