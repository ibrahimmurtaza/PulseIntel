import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import {
  POST as cloneDashboardRoute,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]/clone/route";
import {
  GET as listRevisionsRoute,
  POST as createSnapshotRoute,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]/revisions/route";
import {
  POST as restoreRevisionRoute,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]/revisions/[revisionId]/restore/route";
import {
  POST as addWidgetRoute,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]/widgets/route";
import {
  POST as createDashboardRoute,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/route";
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
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  cookie?: string;
}) {
  const headers = new Headers();

  if (input.cookie) {
    headers.set("cookie", input.cookie);
  }

  if (input.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(input.url, {
    method: input.method ?? (input.body ? "POST" : "GET"),
    headers,
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
}

async function createLaunchDashboard(): Promise<string> {
  const response = await createDashboardRoute(
    createJsonRequest({
      url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
      cookie: createSessionCookie({
        userId: "usr_anna",
        email: "anna@acme.test",
        name: "Anna Analyst",
      }),
      body: {
        name: "Launch Pulse",
        defaultTimeRange: { label: "Last 14 days", windowDays: 14 },
      },
    }),
    {
      params: Promise.resolve({
        tenantSlug: "acme",
        workspaceId: "ws_launch",
      }),
    },
  );

  const payload = (await response.json()) as { dashboard: { id: string } };
  return payload.dashboard.id;
}

async function addWidget(input: {
  dashboardId: string;
  title: string;
  kind?: "chart" | "feed" | "metric" | "insight";
}) {
  const response = await addWidgetRoute(
    createJsonRequest({
      url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${input.dashboardId}/widgets`,
      cookie: createSessionCookie({
        userId: "usr_anna",
        email: "anna@acme.test",
        name: "Anna Analyst",
      }),
      body: {
        kind: input.kind ?? "chart",
        title: input.title,
        x: 0,
        y: 0,
        width: 4,
        height: 3,
      },
    }),
    {
      params: Promise.resolve({
        tenantSlug: "acme",
        workspaceId: "ws_launch",
        dashboardId: input.dashboardId,
      }),
    },
  );

  return response;
}

describe("Dashboard clone & revision routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  describe("POST /api/.../dashboards/[dashboardId]/clone", () => {
    it("creates an independent clone with no live linkage", async () => {
      const sourceId = await createLaunchDashboard();
      const widgetResponse = await addWidget({
        dashboardId: sourceId,
        title: "Sentiment trend",
      });
      expect(widgetResponse.status).toBe(201);

      const response = await cloneDashboardRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${sourceId}/clone`,
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
            dashboardId: sourceId,
          }),
        },
      );

      expect(response.status).toBe(201);
      const payload = (await response.json()) as {
        dashboard: {
          id: string;
          name: string;
          widgetCount: number;
          defaultTimeRange: { label: string; windowDays: number };
        };
      };

      expect(payload.dashboard.id).not.toBe(sourceId);
      expect(payload.dashboard.name).toBe("Launch Pulse (Copy)");
      expect(payload.dashboard.widgetCount).toBe(1);
      expect(payload.dashboard.defaultTimeRange).toEqual({
        label: "Last 14 days",
        windowDays: 14,
      });

      // Verify the clone's widget has a fresh id (no live linkage)
      const revisionsResponse = await listRevisionsRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${payload.dashboard.id}/revisions`,
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
            dashboardId: payload.dashboard.id,
          }),
        },
      );

      expect(revisionsResponse.status).toBe(200);
      const revisionsPayload = (await revisionsResponse.json()) as {
        revisions: Array<{ widgetCount: number }>;
      };
      expect(revisionsPayload.revisions).toHaveLength(1);
      expect(revisionsPayload.revisions[0].widgetCount).toBe(1);
    });

    it("uses the provided name when supplied", async () => {
      const sourceId = await createLaunchDashboard();

      const response = await cloneDashboardRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${sourceId}/clone`,
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: { name: "Launch Pulse - Variant" },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
            dashboardId: sourceId,
          }),
        },
      );

      expect(response.status).toBe(201);
      const payload = (await response.json()) as {
        dashboard: { name: string };
      };
      expect(payload.dashboard.name).toBe("Launch Pulse - Variant");
    });

    it("rejects unauthenticated requests", async () => {
      const sourceId = await createLaunchDashboard();

      const response = await cloneDashboardRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${sourceId}/clone`,
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
            dashboardId: sourceId,
          }),
        },
      );

      expect(response.status).toBe(401);
    });

    it("rejects viewers", async () => {
      const sourceId = await createLaunchDashboard();

      const response = await cloneDashboardRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards/${sourceId}/clone`,
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
            dashboardId: sourceId,
          }),
        },
      );

      expect(response.status).toBe(403);
    });

    it("rejects cloning a dashboard from another tenant", async () => {
      const sourceId = await createLaunchDashboard();

      const response = await cloneDashboardRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_globex_core/dashboards/${sourceId}/clone`,
          cookie: createSessionCookie({
            userId: "usr_liam",
            email: "liam@globex.test",
            name: "Liam External",
          }),
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_globex_core",
            dashboardId: sourceId,
          }),
        },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "workspace_not_found",
      });
    });

    it("returns 404 for an unknown source dashboard", async () => {
      const response = await cloneDashboardRoute(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/dash_missing/clone",
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
            dashboardId: "dash_missing",
          }),
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/.../dashboards/[dashboardId]/revisions", () => {
    it("lists auto-revisions and snapshots newest first", async () => {
      const dashboardId = await createLaunchDashboard();
      await addWidget({ dashboardId, title: "Widget A" });
      await addWidget({ dashboardId, title: "Widget B" });

      const snapshotResponse = await createSnapshotRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: { name: "Pre-launch baseline" },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
            dashboardId,
          }),
        },
      );

      expect(snapshotResponse.status).toBe(201);

      const response = await listRevisionsRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
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
            dashboardId,
          }),
        },
      );

      expect(response.status).toBe(200);
      const payload = (await response.json()) as {
        revisions: Array<{
          label: string;
          isSnapshot: boolean;
          widgetCount: number;
        }>;
      };

      expect(payload.revisions).toHaveLength(3);
      expect(payload.revisions[0]).toMatchObject({
        label: "Pre-launch baseline",
        isSnapshot: true,
        widgetCount: 2,
      });
      expect(payload.revisions[1].isSnapshot).toBe(false);
      expect(payload.revisions[1].widgetCount).toBe(2);
      expect(payload.revisions[2].isSnapshot).toBe(false);
      expect(payload.revisions[2].widgetCount).toBe(1);
    });

    it("returns an empty list when no revisions exist", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await listRevisionsRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
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
            dashboardId,
          }),
        },
      );

      expect(response.status).toBe(200);
      const payload = (await response.json()) as {
        revisions: unknown[];
      };
      expect(payload.revisions).toEqual([]);
    });

    it("rejects non-members", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await listRevisionsRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
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
            dashboardId,
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/.../dashboards/[dashboardId]/revisions", () => {
    it("creates a named snapshot revision", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await createSnapshotRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: { name: "Pre-launch baseline" },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
            dashboardId,
          }),
        },
      );

      expect(response.status).toBe(201);
      const payload = (await response.json()) as {
        revision: {
          label: string;
          isSnapshot: boolean;
          dashboardId: string;
          createdBy: { id: string; name: string };
        };
      };

      expect(payload.revision).toMatchObject({
        label: "Pre-launch baseline",
        isSnapshot: true,
        dashboardId,
        createdBy: { id: "usr_anna", name: "Anna Analyst" },
      });
    });

    it("rejects empty snapshot names", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await createSnapshotRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: { name: "   " },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
            dashboardId,
          }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "snapshot_name_required",
      });
    });

    it("rejects viewers", async () => {
      // Create a dashboard in ws_pricing (where Anna is viewer) as Maya (admin).
      const createResponse = await createDashboardRoute(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            name: "Pricing Pulse",
            defaultTimeRange: { label: "Last 30 days", windowDays: 30 },
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_pricing",
          }),
        },
      );
      const created = (await createResponse.json()) as {
        dashboard: { id: string };
      };

      const response = await createSnapshotRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards/${created.dashboard.id}/revisions`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: { name: "Should fail" },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_pricing",
            dashboardId: created.dashboard.id,
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/.../dashboards/[dashboardId]/revisions/[revisionId]/restore", () => {
    it("restores dashboard state from a snapshot", async () => {
      const dashboardId = await createLaunchDashboard();
      await addWidget({ dashboardId, title: "First widget" });

      // Snapshot the current state (1 widget).
      const snapshotResponse = await createSnapshotRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: { name: "After first widget" },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
            dashboardId,
          }),
        },
      );
      const { revision } = (await snapshotResponse.json()) as {
        revision: { id: string };
      };

      // Add a second widget to diverge from the snapshot.
      await addWidget({ dashboardId, title: "Second widget" });

      // Restore.
      const response = await restoreRevisionRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions/${revision.id}/restore`,
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
            dashboardId,
            revisionId: revision.id,
          }),
        },
      );

      expect(response.status).toBe(200);
      const payload = (await response.json()) as {
        dashboard: { widgetCount: number; widgets: Array<{ title: string }> };
      };

      expect(payload.dashboard.widgetCount).toBe(1);
      expect(payload.dashboard.widgets[0].title).toBe("First widget");

      // The restore itself records a new auto-revision labeled "Restored from ..."
      const listResponse = await listRevisionsRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions`,
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
            dashboardId,
          }),
        },
      );

      const { revisions } = (await listResponse.json()) as {
        revisions: Array<{ label: string; isSnapshot: boolean }>;
      };
      expect(revisions[0]).toMatchObject({
        label: "Restored from After first widget",
        isSnapshot: false,
      });
    });

    it("rejects unknown revision ids", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await restoreRevisionRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/revisions/rev_missing/restore`,
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
            dashboardId,
            revisionId: "rev_missing",
          }),
        },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "revision_not_found",
      });
    });

    it("rejects viewers", async () => {
      // Create dashboard in ws_pricing as Maya (admin).
      const createResponse = await createDashboardRoute(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            name: "Pricing Pulse",
            defaultTimeRange: { label: "Last 30 days", windowDays: 30 },
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_pricing",
          }),
        },
      );
      const { dashboard } = (await createResponse.json()) as {
        dashboard: { id: string };
      };

      // Maya (admin) snapshots it.
      const snapshotResponse = await createSnapshotRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards/${dashboard.id}/revisions`,
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: { name: "Anchor" },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_pricing",
            dashboardId: dashboard.id,
          }),
        },
      );
      const { revision } = (await snapshotResponse.json()) as {
        revision: { id: string };
      };

      // Anna (viewer in ws_pricing) attempts to restore.
      const response = await restoreRevisionRoute(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards/${dashboard.id}/revisions/${revision.id}/restore`,
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
            dashboardId: dashboard.id,
            revisionId: revision.id,
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });
});
