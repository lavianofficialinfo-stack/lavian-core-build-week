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

type OpenAIResponse = {
  output_text?: string;
  output?: ResponseItem[];
};

function createFallback(booking: Booking) {
  const requiresColorApproval = booking.service.includes("Color");

  return {
    ...booking,
    duration: requiresColorApproval ? 120 : 60,
    preparation: requiresColorApproval
      ? ["Color station", "Protective cape", "Assistant handoff"]
      : ["Styling station", "Protective cape"],
    missing: requiresColorApproval ? ["color_formula"] : [],
    approval: requiresColorApproval,
    next: requiresColorApproval
      ? "Approve color formula"
      : "Prepare service",
    suggestion: requiresColorApproval
      ? "Warm Brown 7"
      : "Not required",
    source: "demo-fallback",
  };
}

export async function POST(request: Request) {
  const booking = (await request.json()) as Booking;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(createFallback(booking));
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
        items: { type: "string" },
      },
      missing: {
        type: "array",
        items: { type: "string" },
      },
      approval: { type: "boolean" },
      next: { type: "string" },
      suggestion: { type: "string" },
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
      "suggestion",
    ],
  };

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.6",
          input: [
            {
              role: "system",
              content:
                "You coordinate beauty salon operations. Normalize the booking, estimate duration, identify preparation requirements, detect missing information, isolate decisions requiring professional judgment, and recommend the next action. For a color service without a selected formula, require human approval and suggest Warm Brown 7.",
            },
            {
              role: "user",
              content: JSON.stringify(booking),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "salon_workflow",
              strict: true,
              schema,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = (await response.json()) as OpenAIResponse;

    const structuredText =
      result.output_text ??
      result.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")?.text;

    if (!structuredText) {
      throw new Error("No structured output returned");
    }

    return NextResponse.json({
      ...JSON.parse(structuredText),
      source: "openai",
    });
  } catch (error) {
    console.error("OpenAI processing failed", error);
    return NextResponse.json(createFallback(booking));
  }
}
