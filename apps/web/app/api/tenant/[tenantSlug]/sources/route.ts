import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { toErrorResponse } from "@/lib/route-errors";
import {
  createTenantManualSource,
  createTenantRssSource,
  listTenantSources,
  type SourceKind,
} from "@/lib/tenant-home";

type TenantSourcesRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

type SourceInput = {
  name?: string;
  kind?: string;
  feedUrl?: string;
  description?: string;
};

async function readSourceInput(request: NextRequest): Promise<SourceInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as SourceInput;
  }

  const formData = await request.formData();

  return {
    name: formData.get("name")?.toString(),
    kind: formData.get("kind")?.toString(),
    feedUrl: formData.get("feedUrl")?.toString(),
    description: formData.get("description")?.toString(),
  };
}

function normalizeSourceKind(value: string | undefined): SourceKind {
  return value === "manual" ? "manual" : "rss";
}

export async function GET(
  _request: NextRequest,
  context: TenantSourcesRouteContext,
) {
  const session = await getSessionFromRequest(_request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug } = await context.params;
  const sources = listTenantSources(tenantSlug, session.userId);

  return NextResponse.json({ sources });
}

export async function POST(
  request: NextRequest,
  context: TenantSourcesRouteContext,
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
    const input = await readSourceInput(request);
    const kind = normalizeSourceKind(input.kind);
    const source =
      kind === "manual"
        ? createTenantManualSource({
            tenantSlug,
            createdByUserId: session.userId,
            name: input.name ?? "",
            description: input.description,
          })
        : createTenantRssSource({
            tenantSlug,
            createdByUserId: session.userId,
            name: input.name ?? "",
            feedUrl: input.feedUrl ?? "",
          });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}