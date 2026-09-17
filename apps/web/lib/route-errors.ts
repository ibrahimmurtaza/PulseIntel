import { NextResponse } from "next/server";

const STATUS_BY_ERROR: Record<string, number> = {
  forbidden: 403,
  tenant_not_found: 404,
  workspace_not_found: 404,
  source_not_found: 404,
  dashboard_not_found: 404,
  invitation_not_found: 404,
  revision_not_found: 404,
  user_not_found: 404,
  invitation_not_pending: 409,
};

export function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";
  const status = STATUS_BY_ERROR[message] ?? 400;
  return NextResponse.json({ error: message }, { status });
}
