import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { createManualObservation } from "@/lib/tenant-home";

type CreateObservationPageRouteContext = {
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
      `/tenant/${tenantSlug}/workspaces/${workspaceId}/observations?error=${encodeURIComponent(
        error,
      )}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CreateObservationPageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug, workspaceId } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(
          `/tenant/${tenantSlug}/workspaces/${workspaceId}/observations`,
        )}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const observation = createManualObservation({
      tenantSlug,
      workspaceId,
      sourceId: formData.get("sourceId")?.toString() ?? "",
      createdByUserId: session.userId,
      title: formData.get("title")?.toString() ?? "",
      publishedAt: formData.get("publishedAt")?.toString() ?? "",
      citationNote: formData.get("citationNote")?.toString() ?? "",
      articleUrl: formData.get("articleUrl")?.toString(),
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/observations?created=${encodeURIComponent(
          observation.id,
        )}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(request, tenantSlug, workspaceId, message);
  }
}