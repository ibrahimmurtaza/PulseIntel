import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  collectTenantRssSource,
  parseRssFeedItemInput,
  type RssFeedItemInput,
} from "@/lib/tenant-home";

type CollectSourcePageRouteContext = {
  params: Promise<{
    tenantSlug: string;
    sourceId: string;
  }>;
};

function errorRedirect(
  request: NextRequest,
  tenantSlug: string,
  sourceId: string,
  error: string,
) {
  return NextResponse.redirect(
    new URL(
      `/tenant/${tenantSlug}/sources/${sourceId}?error=${encodeURIComponent(
        error,
      )}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CollectSourcePageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug, sourceId } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(
          `/tenant/${tenantSlug}/sources/${sourceId}`,
        )}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const rawItems = formData.get("items")?.toString() ?? "";

    let parsedInput: unknown = rawItems;

    if (rawItems) {
      try {
        parsedInput = JSON.parse(rawItems);
      } catch {
        parsedInput = rawItems;
      }
    }

    if (!Array.isArray(parsedInput)) {
      throw new Error("items_required");
    }

    const items: RssFeedItemInput[] = [];

    for (const entry of parsedInput) {
      const parsedItem = parseRssFeedItemInput(entry);

      if (!parsedItem) {
        throw new Error("feed_item_required");
      }

      items.push(parsedItem);
    }

    const result = collectTenantRssSource({
      tenantSlug,
      sourceId,
      collectedByUserId: session.userId,
      items,
    });

    const params = new URLSearchParams({
      collected: String(result.created.length),
      duplicates: String(result.duplicateCount),
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/sources/${sourceId}?${params.toString()}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(request, tenantSlug, sourceId, message);
  }
}
