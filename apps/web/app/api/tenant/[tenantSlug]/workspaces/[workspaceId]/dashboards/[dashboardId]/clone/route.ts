import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { cloneDashboard } from "@/lib/tenant-home";

type CloneDashboardRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
  }>;
};

async function readCloneInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as {
      name?: string;
      description?: string;
    };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    return {
      name: formData.get("name")?.toString(),
      description: formData.get("description")?.toString(),
    };
  }

  return {};
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "name_required":
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

export async function POST(
  request: NextRequest,
  context: CloneDashboardRouteContext,
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
    const input = await readCloneInput(request);
    const dashboard = cloneDashboard({
      tenantSlug,
      workspaceId,
      sourceDashboardId: dashboardId,
      createdByUserId: session.userId,
      name: input.name,
      description: input.description,
    });

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
