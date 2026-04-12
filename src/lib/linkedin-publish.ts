import { getServiceClient } from "@/lib/supabase"

interface LinkedInCredentials {
  access_token: string
  expires_at: string
  person_urn: string
  name: string
}

export async function getLinkedInCredentials(): Promise<LinkedInCredentials | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "linkedin")
    .single()

  if (!data?.value) return null

  const creds = data.value as LinkedInCredentials

  if (new Date(creds.expires_at) < new Date()) {
    return null
  }

  return creds
}

export interface PublishResult {
  success: boolean
  linkedin_post_id?: string
  error?: string
  post_title?: string
}

// ─── LinkedIn Image Upload (register → upload binary → get asset URN) ───

async function registerImageUpload(
  personUrn: string,
  accessToken: string
): Promise<{ uploadUrl: string; asset: string }> {
  const res = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: personUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    }
  )

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`LinkedIn registerUpload failed (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  const uploadUrl =
    data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl
  const asset = data.value.asset

  return { uploadUrl, asset }
}

async function uploadImageToLinkedIn(
  imageUrl: string,
  uploadUrl: string,
  accessToken: string
): Promise<void> {
  // Download image from Supabase Storage
  const imageRes = await fetch(imageUrl)
  if (!imageRes.ok) {
    throw new Error(`Failed to download image from ${imageUrl}: ${imageRes.status}`)
  }

  const imageBuffer = await imageRes.arrayBuffer()
  const contentType = imageRes.headers.get("content-type") || "image/jpeg"

  // Upload to LinkedIn
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body: imageBuffer,
  })

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text()
    throw new Error(`LinkedIn image upload failed (${uploadRes.status}): ${errBody}`)
  }
}

/**
 * Upload images to LinkedIn and return their asset URNs.
 * Processes up to 9 images (LinkedIn limit for multi-image posts).
 */
async function uploadImagesToLinkedIn(
  mediaUrls: string[],
  personUrn: string,
  accessToken: string
): Promise<string[]> {
  const urls = mediaUrls.slice(0, 9) // LinkedIn max 9 images
  const assets: string[] = []

  for (const imageUrl of urls) {
    try {
      const { uploadUrl, asset } = await registerImageUpload(personUrn, accessToken)
      await uploadImageToLinkedIn(imageUrl, uploadUrl, accessToken)
      assets.push(asset)
    } catch (err) {
      console.error(`[LinkedIn Publish] Image upload failed for ${imageUrl}:`, err)
      // Continue with other images — don't fail the whole publish
    }
  }

  return assets
}

// ─── Main publish function ──────────────────────────────────────────

/**
 * Publish a post to LinkedIn.
 * Handles: fetch post, upload images if any, build payload, call LinkedIn API, update DB status.
 */
export async function publishToLinkedIn(postId: string): Promise<PublishResult> {
  const creds = await getLinkedInCredentials()
  if (!creds) {
    return {
      success: false,
      error: "LinkedIn non connecté ou token expiré. Reconnecte-toi dans Settings.",
    }
  }

  const supabase = getServiceClient()

  // Fetch the post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single()

  if (postError || !post) {
    return { success: false, error: "Post introuvable" }
  }

  // Build LinkedIn post payload
  const hashtags = (post.hashtags || [])
    .map((h: string) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ")

  const fullContent = post.content + (hashtags ? `\n\n${hashtags}` : "")

  // Upload images to LinkedIn if the post has media
  const mediaUrls: string[] = post.media_urls || []
  let shareMediaCategory: "NONE" | "IMAGE" = "NONE"
  let media: Array<{ status: string; media: string }> = []

  if (mediaUrls.length > 0) {
    const assetUrns = await uploadImagesToLinkedIn(
      mediaUrls,
      creds.person_urn,
      creds.access_token
    )

    if (assetUrns.length > 0) {
      shareMediaCategory = "IMAGE"
      media = assetUrns.map((asset) => ({
        status: "READY",
        media: asset,
      }))
    }
  }

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text: fullContent },
    shareMediaCategory,
  }

  if (media.length > 0) {
    shareContent.media = media
  }

  const linkedinPayload = {
    author: creds.person_urn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": shareContent,
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
    return {
      success: false,
      error: `Échec publication LinkedIn (${publishRes.status})`,
      post_title: post.title,
    }
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

  return {
    success: true,
    linkedin_post_id: linkedinPostId,
    post_title: post.title,
  }
}
