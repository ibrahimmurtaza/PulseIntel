import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  createDashboardSnapshot,
  listDashboardRevisions,
} from "@/lib/tenant-home";

type DashboardRevisionsRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
  }>;
};

async function readSnapshotInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as { name?: string };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return { name: formData.get("name")?.toString() };
  }

  return {};
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "snapshot_name_required":
      return NextResponse.json({ error: message }, { status: 400 });
    case "workspace_not_found":
    case "dashboard_not_found":
      return NextResponse.json({ error: message }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: DashboardRevisionsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId, dashboardId } = await context.params;
  const revisions = listDashboardRevisions({
    tenantSlug,
    workspaceId,
    dashboardId,
    userId: session.userId,
  });

  if (revisions === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ revisions });
}

export async function POST(
  request: NextRequest,
  context: DashboardRevisionsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId, dashboardId } = await context.params;

  try {
    const input = await readSnapshotInput(request);
    const revision = createDashboardSnapshot({
      tenantSlug,
      workspaceId,
      dashboardId,
      createdByUserId: session.userId,
      name: input.name ?? "",
    });

    return NextResponse.json({ revision }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
