import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin, withApiError } from "@/lib/api";
import { importRecords, recordsSchema } from "@/lib/catalog-import";

export const POST = withApiError("import anime metadata", async (request: NextRequest) => {
  const authorizationError = authorizeAdmin(request);
  if (authorizationError) return authorizationError;

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || !("records" in payload)) {
    return NextResponse.json({ error: "Invalid import payload." }, { status: 400 });
  }
  const parsed = recordsSchema.max(100).safeParse(payload.records);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid import payload.", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    return NextResponse.json(await importRecords(parsed.data));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid import payload.", details: error.flatten() }, { status: 400 });
    }
    throw error;
  }
});
