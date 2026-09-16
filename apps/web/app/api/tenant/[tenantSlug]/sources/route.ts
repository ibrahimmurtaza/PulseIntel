import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  createTenantRssSource,
  listTenantSources,
} from "@/lib/tenant-home";

type TenantSourcesRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

async function readSourceInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as {
      name?: string;
      feedUrl?: string;
    };
  }

  const formData = await request.formData();

  return {
    name: formData.get("name")?.toString(),
    feedUrl: formData.get("feedUrl")?.toString(),
  };
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "name_required":
    case "feed_url_required":
    case "source_already_exists":
    case "source_feed_already_registered":
      return NextResponse.json({ error: message }, { status: 400 });
    case "tenant_not_found":
      return NextResponse.json({ error: message }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  context: TenantSourcesRouteContext,
) {
  const session = await getSessionFromRequest(_request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug } = await context.params;
  const sources = listTenantSources(tenantSlug, session.userId);

  return NextResponse.json({ sources });
}

export async function POST(
  request: NextRequest,
  context: TenantSourcesRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug } = await context.params;

  try {
    const input = await readSourceInput(request);
    const source = createTenantRssSource({
      tenantSlug,
      createdByUserId: session.userId,
      name: input.name ?? "",
      feedUrl: input.feedUrl ?? "",
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
