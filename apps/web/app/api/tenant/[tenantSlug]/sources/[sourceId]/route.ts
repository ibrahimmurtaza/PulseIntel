import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { getTenantSource } from "@/lib/tenant-home";

type TenantSourceRouteContext = {
  params: Promise<{
    tenantSlug: string;
    sourceId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: TenantSourceRouteContext,
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

  return NextResponse.json({ source });
}
