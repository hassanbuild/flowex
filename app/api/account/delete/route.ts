import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Your session could not be verified." },
      { status: 401 }
    );
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return NextResponse.json(
      { error: "Your session could not be verified." },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session could not be verified." },
        { status: 401 }
      );
    }

    const { error: deleteError } =
      await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error(
        "Flowex account deletion error:",
        deleteError.message
      );

      return NextResponse.json(
        { error: "Flowex could not delete this account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error("Flowex account deletion error:", error);

    return NextResponse.json(
      { error: "Flowex could not delete this account." },
      { status: 500 }
    );
  }
}
