import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { publishToLinkedIn } from "@/lib/linkedin-publish"

const publishSchema = z.object({
  post_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = publishSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "post_id requis" }, { status: 400 })
  }

  const result = await publishToLinkedIn(parsed.data.post_id)

  if (!result.success) {
    const status = result.error?.includes("non connecté") ? 401 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({
    success: true,
    linkedin_post_id: result.linkedin_post_id,
  })
}
