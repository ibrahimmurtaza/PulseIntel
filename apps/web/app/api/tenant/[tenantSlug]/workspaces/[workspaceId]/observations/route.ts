import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { toErrorResponse } from "@/lib/route-errors";
import {
  createManualObservation,
  getWorkspaceMembership,
  listWorkspaceObservations,
} from "@/lib/tenant-home";

type WorkspaceObservationsRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

type CreateObservationInput = {
  sourceId?: string;
  title?: string;
  publishedAt?: string;
  citationNote?: string;
  articleUrl?: string;
};

async function readObservationInput(
  request: NextRequest,
): Promise<CreateObservationInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as CreateObservationInput;
  }

  const formData = await request.formData();

  return {
    sourceId: formData.get("sourceId")?.toString(),
    title: formData.get("title")?.toString(),
    publishedAt: formData.get("publishedAt")?.toString(),
    citationNote: formData.get("citationNote")?.toString(),
    articleUrl: formData.get("articleUrl")?.toString(),
  };
}

export async function GET(
  request: NextRequest,
  context: WorkspaceObservationsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId } = await context.params;

  if (!getWorkspaceMembership(tenantSlug, workspaceId, session.userId)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 403 },
    );
  }

  const observations = listWorkspaceObservations(
    tenantSlug,
    workspaceId,
    session.userId,
  );

  return NextResponse.json({ observations });
}

export async function POST(
  request: NextRequest,
  context: WorkspaceObservationsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId } = await context.params;

  try {
    const input = await readObservationInput(request);
    const observation = createManualObservation({
      tenantSlug,
      workspaceId,
      sourceId: input.sourceId ?? "",
      createdByUserId: session.userId,
      title: input.title ?? "",
      publishedAt: input.publishedAt ?? "",
      citationNote: input.citationNote ?? "",
      articleUrl: input.articleUrl,
    });

    return NextResponse.json({ observation }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}