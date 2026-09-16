import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  collectTenantRssSource,
  getTenantSource,
  parseRssFeedItemInput,
  type RssFeedItemInput,
} from "@/lib/tenant-home";

type TenantSourceCollectRouteContext = {
  params: Promise<{
    tenantSlug: string;
    sourceId: string;
  }>;
};

type CollectPayload = {
  items?: unknown;
};

async function readCollectInput(request: NextRequest): Promise<CollectPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as CollectPayload;
  }

  const formData = await request.formData();
  const rawItems = formData.get("items")?.toString();
  let items: unknown = rawItems;

  if (rawItems) {
    try {
      items = JSON.parse(rawItems);
    } catch {
      items = rawItems;
    }
  }

  return { items };
}

function parseItems(input: unknown): RssFeedItemInput[] {
  if (!Array.isArray(input)) {
    throw new Error("items_required");
  }

  const items: RssFeedItemInput[] = [];

  for (const entry of input) {
    const parsed = parseRssFeedItemInput(entry);

    if (!parsed) {
      throw new Error("feed_item_required");
    }

    items.push(parsed);
  }

  return items;
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "items_required":
    case "feed_item_required":
      return NextResponse.json({ error: message }, { status: 400 });
    case "source_not_found":
    case "source_kind_unsupported":
      return NextResponse.json({ error: message }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: TenantSourceCollectRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, sourceId } = await context.params;
  const source = getTenantSource(tenantSlug, sourceId, session.userId);

  if (!source) {
    return NextResponse.json(
      { error: "source_not_found" },
      { status: 404 },
    );
  }

  try {
    const input = await readCollectInput(request);
    const items = parseItems(input.items);
    const result = collectTenantRssSource({
      tenantSlug,
      sourceId,
      collectedByUserId: session.userId,
      items,
    });

    return NextResponse.json(
      {
        created: result.created.length,
        duplicates: result.duplicateCount,
        observations: result.observations,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
