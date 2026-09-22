import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { getSourceHealth } from "@/lib/tenant-home";

type TenantSourceHealthRouteContext = {
  params: Promise<{
    tenantSlug: string;
    sourceId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: TenantSourceHealthRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, sourceId } = await context.params;
  const health = getSourceHealth(tenantSlug, sourceId, session.userId);

  if (!health) {
    return NextResponse.json(
      { error: "source_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ health });
}
