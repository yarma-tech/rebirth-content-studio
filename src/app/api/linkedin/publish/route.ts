import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"

const publishSchema = z.object({
  post_id: z.string().uuid(),
})

async function getLinkedInCredentials() {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "linkedin")
    .single()

  if (!data?.value) return null

  const creds = data.value as {
    access_token: string
    expires_at: string
    person_urn: string
    name: string
  }

  // Check token expiry
  if (new Date(creds.expires_at) < new Date()) {
    return null
  }

  return creds
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = publishSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "post_id requis" }, { status: 400 })
  }

  const creds = await getLinkedInCredentials()
  if (!creds) {
    return NextResponse.json(
      { error: "LinkedIn non connecte ou token expire. Reconnecte-toi dans Settings." },
      { status: 401 }
    )
  }

  const supabase = getServiceClient()

  // Fetch the post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", parsed.data.post_id)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 })
  }

  // Build LinkedIn post payload
  const hashtags = (post.hashtags || [])
    .map((h: string) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ")

  const fullContent = post.content + (hashtags ? `\n\n${hashtags}` : "")

  const linkedinPayload = {
    author: creds.person_urn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: fullContent },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  }

  // Publish to LinkedIn
  const publishRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(linkedinPayload),
  })

  if (!publishRes.ok) {
    const errBody = await publishRes.text()
    console.error("[LinkedIn Publish] Failed:", publishRes.status, errBody)
    return NextResponse.json(
      { error: `Echec publication LinkedIn: ${publishRes.status}` },
      { status: 500 }
    )
  }

  const publishData = await publishRes.json()
  const linkedinPostId = publishData.id

  // Update post status in DB
  await supabase
    .from("posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      linkedin_post_id: linkedinPostId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", post.id)

  return NextResponse.json({
    success: true,
    linkedin_post_id: linkedinPostId,
  })
}
