import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({
      synced: false,
      mode: "demo",
      record: payload,
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-lavian-token": process.env.SHEETS_SYNC_TOKEN || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Spreadsheet sync failed");
    }

    return NextResponse.json({
      synced: true,
      mode: "live",
    });
  } catch (error) {
    console.error("Spreadsheet sync failed", error);

    return NextResponse.json(
      {
        synced: false,
        error: "sync_failed",
      },
      { status: 502 },
    );
  }
}
