import { NextRequest, NextResponse } from "next/server";

type ApiHandler<Args extends unknown[]> = (...args: Args) => Promise<NextResponse>;

export function withApiError<Args extends unknown[]>(
  operation: string,
  handler: ApiHandler<Args>,
): ApiHandler<Args> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`[api] ${operation} failed`, error);
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
  };
}

export function authorizeAdmin(request: NextRequest) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Admin API is not configured." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}
