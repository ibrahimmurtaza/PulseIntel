import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  addDashboardWidget,
  parseWidgetKindInput,
} from "@/lib/tenant-home";

type DashboardWidgetsRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
  }>;
};

async function readWidgetInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as {
      kind?: string;
      title?: string;
      description?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      timeRangeLabel?: string;
      timeRangeWindowDays?: number;
    };
  }

  const formData = await request.formData();
  const overrideEnabled = formData.get("overrideEnabled")?.toString() === "on";

  return {
    kind: formData.get("kind")?.toString(),
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    x: Number(formData.get("x")),
    y: Number(formData.get("y")),
    width: Number(formData.get("width")),
    height: Number(formData.get("height")),
    timeRangeLabel: overrideEnabled
      ? formData.get("timeRangeLabel")?.toString()
      : undefined,
    timeRangeWindowDays: overrideEnabled
      ? Number(formData.get("timeRangeWindowDays"))
      : undefined,
  };
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "widget_kind_required":
    case "title_required":
    case "widget_layout_required":
    case "time_range_required":
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
  context: DashboardWidgetsRouteContext,
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
    const input = await readWidgetInput(request);
    const kind = parseWidgetKindInput(input.kind);

    if (!kind) {
      throw new Error("widget_kind_required");
    }

    const widget = addDashboardWidget({
      tenantSlug,
      workspaceId,
      dashboardId,
      createdByUserId: session.userId,
      kind,
      title: input.title ?? "",
      description: input.description,
      x: input.x ?? 0,
      y: input.y ?? 0,
      width: input.width ?? 0,
      height: input.height ?? 0,
      timeRangeOverride:
        input.timeRangeLabel !== undefined &&
        input.timeRangeWindowDays !== undefined
          ? {
              label: input.timeRangeLabel,
              windowDays: input.timeRangeWindowDays,
            }
          : undefined,
    });

    return NextResponse.json({ widget }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
