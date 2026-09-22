import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { listSourceCollectionRuns } from "@/lib/tenant-home";

type TenantSourceRunsRouteContext = {
  params: Promise<{
    tenantSlug: string;
    sourceId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: TenantSourceRunsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, sourceId } = await context.params;
  const runs = listSourceCollectionRuns(tenantSlug, sourceId, session.userId);

  if (!runs) {
    return NextResponse.json(
      { error: "source_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ runs });
}
