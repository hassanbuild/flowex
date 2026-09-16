import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "This legacy lead capture endpoint has been retired. Use the Flowex intake endpoint.",
    },
    {
      status: 410,
    }
  );
}
