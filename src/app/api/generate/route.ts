import { NextRequest } from "next/server"
import { z } from "zod"
import { generateDraft, improveDraft } from "@/lib/ai"

const generateSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("improve"),
    content: z.string().min(1),
    instruction: z.string().min(1),
  }),
  z.object({
    mode: z.undefined().optional(),
    topic: z.string().min(1),
    pillar: z.enum(["build_in_public", "vulgarisation", "retour_terrain"]),
    tone: z.string().default("accessible"),
  }),
])

export async function POST(request: NextRequest) {
  // Block external requests (prevents unauthorized AI cost abuse)
  const origin = request.headers.get("origin") || request.headers.get("referer") || ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  if (!origin.startsWith(appUrl)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const body = await request.json()
  const parsed = generateSchema.safeParse(body)

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    let stream: ReadableStream

    if (parsed.data.mode === "improve") {
      stream = await improveDraft(parsed.data.content, parsed.data.instruction)
    } else {
      stream = await generateDraft(
        parsed.data.topic,
        parsed.data.pillar,
        parsed.data.tone
      )
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de génération"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
