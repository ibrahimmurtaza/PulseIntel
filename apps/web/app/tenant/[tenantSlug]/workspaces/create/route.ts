import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { createWorkspace } from "@/lib/tenant-home";

type CreateWorkspacePageRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

function errorRedirect(request: NextRequest, tenantSlug: string, error: string) {
  return NextResponse.redirect(
    new URL(
      `/tenant/${tenantSlug}/workspaces?error=${encodeURIComponent(error)}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CreateWorkspacePageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(`/tenant/${tenantSlug}/workspaces`)}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const workspace = createWorkspace({
      tenantSlug,
      createdByUserId: session.userId,
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() || undefined,
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/workspaces?created=${encodeURIComponent(workspace.id)}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(request, tenantSlug, message);
  }
}
