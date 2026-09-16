import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { createTenantRssSource } from "@/lib/tenant-home";

type CreateSourcePageRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

function errorRedirect(
  request: NextRequest,
  tenantSlug: string,
  error: string,
) {
  return NextResponse.redirect(
    new URL(
      `/tenant/${tenantSlug}/sources?error=${encodeURIComponent(error)}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CreateSourcePageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(
          `/tenant/${tenantSlug}/sources`,
        )}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const source = createTenantRssSource({
      tenantSlug,
      createdByUserId: session.userId,
      name: formData.get("name")?.toString() ?? "",
      feedUrl: formData.get("feedUrl")?.toString() ?? "",
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/sources?created=${encodeURIComponent(
          source.id,
        )}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(request, tenantSlug, message);
  }
}
