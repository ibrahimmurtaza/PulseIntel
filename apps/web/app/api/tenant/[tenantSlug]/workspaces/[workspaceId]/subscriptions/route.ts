import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  createSourceSubscription,
  getWorkspaceMembership,
  listWorkspaceSourceSubscriptions,
  parseSubscriptionKeywordsInput,
} from "@/lib/tenant-home";

type WorkspaceSubscriptionsRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

async function readSubscriptionInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      sourceId?: string;
      keywords?: unknown;
    };

    return {
      sourceId: body.sourceId,
      keywords: parseSubscriptionKeywordsInput(body.keywords),
    };
  }

  const formData = await request.formData();

  return {
    sourceId: formData.get("sourceId")?.toString() ?? "",
    keywords: parseSubscriptionKeywordsInput(formData.get("keywords")?.toString() ?? ""),
  };
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "source_not_found":
    case "workspace_not_found":
      return NextResponse.json({ error: message }, { status: 400 });
    case "subscription_already_exists":
      return NextResponse.json({ error: message }, { status: 400 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  context: WorkspaceSubscriptionsRouteContext,
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

  const subscriptions = listWorkspaceSourceSubscriptions(
    tenantSlug,
    workspaceId,
    session.userId,
  );

  return NextResponse.json({ subscriptions });
}

export async function POST(
  request: NextRequest,
  context: WorkspaceSubscriptionsRouteContext,
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
    const input = await readSubscriptionInput(request);
    const subscription = createSourceSubscription({
      tenantSlug,
      workspaceId,
      sourceId: input.sourceId ?? "",
      createdByUserId: session.userId,
      keywords: input.keywords,
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
