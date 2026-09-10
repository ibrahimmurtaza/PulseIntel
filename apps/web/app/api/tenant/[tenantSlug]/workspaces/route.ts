import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  createWorkspace,
  getTenantBySlug,
  listTenantWorkspacesForUser,
} from "@/lib/tenant-home";

type TenantWorkspacesRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

async function readWorkspaceInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as {
      name?: string;
      description?: string;
    };
  }

  const formData = await request.formData();

  return {
    name: formData.get("name")?.toString(),
    description: formData.get("description")?.toString(),
  };
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "name_required":
    case "workspace_already_exists":
      return NextResponse.json({ error: message }, { status: 400 });
    case "tenant_not_found":
      return NextResponse.json({ error: message }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: TenantWorkspacesRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug } = await context.params;
  const tenant = getTenantBySlug(tenantSlug);

  if (!tenant) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const workspaces = listTenantWorkspacesForUser(tenantSlug, session.userId);

  return NextResponse.json({
    tenant: {
      slug: tenant.slug,
      name: tenant.name,
    },
    workspaces,
  });
}

export async function POST(
  request: NextRequest,
  context: TenantWorkspacesRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug } = await context.params;

  try {
    const input = await readWorkspaceInput(request);
    const workspace = createWorkspace({
      tenantSlug,
      createdByUserId: session.userId,
      name: input.name ?? "",
      description: input.description,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
