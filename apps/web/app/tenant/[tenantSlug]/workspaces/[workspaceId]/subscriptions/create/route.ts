import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  createSourceSubscription,
  parseSubscriptionKeywordsInput,
} from "@/lib/tenant-home";

type CreateSubscriptionPageRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

function errorRedirect(
  request: NextRequest,
  tenantSlug: string,
  workspaceId: string,
  error: string,
) {
  return NextResponse.redirect(
    new URL(
      `/tenant/${tenantSlug}/workspaces/${workspaceId}/subscriptions?error=${encodeURIComponent(
        error,
      )}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CreateSubscriptionPageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug, workspaceId } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(
          `/tenant/${tenantSlug}/workspaces/${workspaceId}/subscriptions`,
        )}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const rawKeywords = formData.get("keywords")?.toString() ?? "";

    const keywords = parseSubscriptionKeywordsInput(
      rawKeywords
        .split(/[,\n]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    );

    const subscription = createSourceSubscription({
      tenantSlug,
      workspaceId,
      sourceId: formData.get("sourceId")?.toString() ?? "",
      createdByUserId: session.userId,
      keywords,
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/subscriptions?created=${encodeURIComponent(
          subscription.id,
        )}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(request, tenantSlug, workspaceId, message);
  }
}
