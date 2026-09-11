import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  createDashboard,
  getWorkspaceMembership,
  listWorkspaceDashboards,
} from "@/lib/tenant-home";

type DashboardsRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

async function readDashboardInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as {
      name?: string;
      description?: string;
      defaultTimeRange?: {
        label?: string;
        windowDays?: number;
      };
    };
  }

  const formData = await request.formData();

  return {
    name: formData.get("name")?.toString(),
    description: formData.get("description")?.toString(),
    defaultTimeRange: {
      label: formData.get("timeRangeLabel")?.toString(),
      windowDays: Number(formData.get("timeRangeWindowDays")),
    },
  };
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "name_required":
    case "dashboard_already_exists":
    case "time_range_required":
      return NextResponse.json({ error: message }, { status: 400 });
    case "workspace_not_found":
      return NextResponse.json({ error: message }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  context: DashboardsRouteContext,
) {
  const session = await getSessionFromRequest(_request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId } = await context.params;

  if (!getWorkspaceMembership(tenantSlug, workspaceId, session.userId)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 403 },
    );
  }

  const dashboards = listWorkspaceDashboards(
    tenantSlug,
    workspaceId,
    session.userId,
  );

  return NextResponse.json({ dashboards });
}

export async function POST(
  request: NextRequest,
  context: DashboardsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId } = await context.params;

  try {
    const input = await readDashboardInput(request);
    const dashboard = createDashboard({
      tenantSlug,
      workspaceId,
      createdByUserId: session.userId,
      name: input.name ?? "",
      description: input.description,
      defaultTimeRange: {
        label: input.defaultTimeRange?.label ?? "",
        windowDays: input.defaultTimeRange?.windowDays ?? 0,
      },
    });

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
