import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import {
  GET as listDashboards,
  POST as createDashboard,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/route";
import { GET as getDashboard } from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]/route";
import {
  POST as addWidget,
} from "@/app/api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]/widgets/route";
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

describe("Dashboard routes", () => {
  beforeEach(() => {
    delete process.env.AUTH_MODE;
    resetDemoTenantState();
  });

  describe("GET /api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await listDashboards(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "unauthenticated",
      });
    });

    it("returns an empty list for a workspace member with no dashboards", async () => {
      const response = await listDashboards(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
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
      expect(payload.dashboards).toEqual([]);
    });

    it("rejects non-members", async () => {
      const response = await listDashboards(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_strategy/dashboards",
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
    });

    it("rejects workspaces from another tenant", async () => {
      const response = await listDashboards(
        createGetRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_globex_core/dashboards",
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
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
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

      expect(response.status).toBe(401);
    });

    it("rejects workspace viewers (forbidden)", async () => {
      const response = await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
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

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    });

    it("lets a workspace editor create a dashboard with a default time range", async () => {
      const response = await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            name: "Launch Pulse",
            description: "Daily signals during launch week",
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

      expect(response.status).toBe(201);
      const payload = await response.json();
      expect(payload.dashboard).toMatchObject({
        tenantSlug: "acme",
        workspaceId: "ws_launch",
        name: "Launch Pulse",
        description: "Daily signals during launch week",
        defaultTimeRange: { label: "Last 14 days", windowDays: 14 },
        widgetCount: 0,
        canManage: true,
      });
    });

    it("rejects empty dashboard names", async () => {
      const response = await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            name: "   ",
            defaultTimeRange: { label: "Last 7 days", windowDays: 7 },
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
        error: "name_required",
      });
    });

    it("rejects duplicate dashboard names within the same workspace", async () => {
      await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            name: "Launch Pulse",
            defaultTimeRange: { label: "Last 7 days", windowDays: 7 },
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_launch",
          }),
        },
      );

      const response = await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            name: "launch pulse",
            defaultTimeRange: { label: "Last 7 days", windowDays: 7 },
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
        error: "dashboard_already_exists",
      });
    });

    it("rejects invalid time ranges", async () => {
      const response = await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards",
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            name: "Bad Range",
            defaultTimeRange: { label: "", windowDays: 0 },
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
        error: "time_range_required",
      });
    });

    it("returns 404 for an unknown workspace", async () => {
      const response = await createDashboard(
        createJsonRequest({
          url: "http://localhost:3000/api/tenant/acme/workspaces/ws_missing/dashboards",
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            name: "Phantom",
            defaultTimeRange: { label: "Last 30 days", windowDays: 30 },
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_missing",
          }),
        },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "workspace_not_found",
      });
    });
  });

  describe("GET /api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]", () => {
    async function createLaunchDashboard() {
      const response = await createDashboard(
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

    it("returns dashboard detail with empty widgets for a member", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await getDashboard(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}`,
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
      const payload = await response.json();
      expect(payload.dashboard).toMatchObject({
        id: dashboardId,
        name: "Launch Pulse",
        defaultTimeRange: { label: "Last 14 days", windowDays: 14 },
        widgetCount: 0,
        canManage: true,
        role: "editor",
        widgets: [],
      });
    });

    it("rejects non-members", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await getDashboard(
        createGetRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}`,
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

  describe("POST /api/tenant/[tenantSlug]/workspaces/[workspaceId]/dashboards/[dashboardId]/widgets", () => {
    async function createLaunchDashboard() {
      const response = await createDashboard(
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

    async function createDashboardAsAdmin(
      workspaceId: string,
      name: string,
    ): Promise<string> {
      const response = await createDashboard(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/${workspaceId}/dashboards`,
          cookie: createSessionCookie({
            userId: "usr_maya",
            email: "maya@acme.test",
            name: "Maya Market Lead",
          }),
          body: {
            name,
            defaultTimeRange: { label: "Last 30 days", windowDays: 30 },
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId,
          }),
        },
      );

      const payload = (await response.json()) as { dashboard: { id: string } };
      return payload.dashboard.id;
    }

    it("lets an editor add a widget with grid coordinates", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await addWidget(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/widgets`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            kind: "chart",
            title: "Sentiment trend",
            description: "Daily sentiment over the launch window",
            x: 0,
            y: 0,
            width: 6,
            height: 4,
          },
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
      const payload = await response.json();
      expect(payload.widget).toMatchObject({
        kind: "chart",
        title: "Sentiment trend",
        description: "Daily sentiment over the launch window",
        x: 0,
        y: 0,
        width: 6,
        height: 4,
        dashboardId,
      });
      expect(payload.widget.timeRangeOverride).toBeUndefined();
    });

    it("rejects unknown widget kinds", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await addWidget(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/widgets`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            kind: "heatmap",
            title: "Heatmap",
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
            dashboardId,
          }),
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "widget_kind_required",
      });
    });

    it("rejects non-positive grid sizes", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await addWidget(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/widgets`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            kind: "chart",
            title: "Tiny",
            x: 0,
            y: 0,
            width: 0,
            height: 3,
          },
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
        error: "widget_layout_required",
      });
    });

    it("rejects viewers (forbidden)", async () => {
      const pricingDashboardId = await createDashboardAsAdmin(
        "ws_pricing",
        "Pricing Pulse",
      );

      const response = await addWidget(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_pricing/dashboards/${pricingDashboardId}/widgets`,
          cookie: createSessionCookie({
            userId: "usr_anna",
            email: "anna@acme.test",
            name: "Anna Analyst",
          }),
          body: {
            kind: "chart",
            title: "Attempted",
            x: 0,
            y: 0,
            width: 4,
            height: 3,
          },
        }),
        {
          params: Promise.resolve({
            tenantSlug: "acme",
            workspaceId: "ws_pricing",
            dashboardId: pricingDashboardId,
          }),
        },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: "forbidden",
      });
    });

    it("rejects unauthenticated requests", async () => {
      const dashboardId = await createLaunchDashboard();

      const response = await addWidget(
        createJsonRequest({
          url: `http://localhost:3000/api/tenant/acme/workspaces/ws_launch/dashboards/${dashboardId}/widgets`,
          body: {
            kind: "chart",
            title: "Anon",
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
            dashboardId,
          }),
        },
      );

      expect(response.status).toBe(401);
    });
  });
});
