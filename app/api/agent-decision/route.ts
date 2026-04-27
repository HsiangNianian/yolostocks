import { NextResponse } from "next/server";

import { generateAgentDecision } from "@/lib/agent/ai";
import { agentDecisionRequestSchema } from "@/lib/agent/ai-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = agentDecisionRequestSchema.parse(await request.json());
    const decision = await generateAgentDecision(payload);

    return NextResponse.json({
      decision,
      source: "ai",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown agent decision error";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
