import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { resolveTenantHome } from "@/lib/tenant-home";

type TenantHomeRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: TenantHomeRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug } = await context.params;
  const tenantHome = resolveTenantHome(tenantSlug, session.userId);

  if (!tenantHome) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  return NextResponse.json(tenantHome);
}
