import { NextResponse } from "next/server";

type Booking = {
  customer: string;
  service: string;
  stylist: string;
  date: string;
  time: string;
};

type ResponseItem = {
  type?: string;
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type APIResponse = {
  output_text?: string;
  output?: ResponseItem[];
};

function fallback(booking: Booking) {
  const includesColor = booking.service.includes("Color");

  return {
    ...booking,
    duration: includesColor ? 120 : 60,
    preparation: includesColor
      ? ["Color station", "Protective cape", "Assistant handoff"]
      : ["Styling station", "Protective cape"],
    missing: includesColor ? ["color_formula"] : [],
    approval: includesColor,
    next: includesColor
      ? "Approve color formula"
      : "Prepare service",
    suggestion: includesColor ? "Warm Brown 7" : "Not required",
    source: "demo-fallback"
  };
}

export async function POST(request: Request) {
  const booking = (await request.json()) as Booking;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallback(booking));
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      customer: { type: "string" },
      service: { type: "string" },
      stylist: { type: "string" },
      date: { type: "string" },
      time: { type: "string" },
      duration: { type: "number" },
      preparation: {
        type: "array",
        items: { type: "string" }
      },
      missing: {
        type: "array",
        items: { type: "string" }
      },
      approval: { type: "boolean" },
      next: { type: "string" },
      suggestion: { type: "string" }
    },
    required: [
      "customer",
      "service",
      "stylist",
      "date",
      "time",
      "duration",
      "preparation",
      "missing",
      "approval",
      "next",
      "suggestion"
    ]
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6",
        input: [
          {
            role: "system",
            content:
              "You coordinate salon operations. Normalize the booking, estimate duration, identify preparation, flag only decisions requiring professional judgment, and suggest the next action. For any color service without a formula, require approval and suggest Warm Brown 7."
          },
          {
            role: "user",
            content: JSON.stringify(booking)
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "salon_workflow",
            strict: true,
            schema
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = (await response.json()) as APIResponse;

    const outputText =
      result.output_text ??
      result.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")?.text;

    if (!outputText) {
      throw new Error("No structured output returned");
    }

    return NextResponse.json({
      ...JSON.parse(outputText),
      source: "openai"
    });
  } catch (error) {
    console.error("OpenAI processing failed", error);
    return NextResponse.json(fallback(booking));
  }
}
