import { getServiceClient } from "@/lib/supabase"
import { getToken } from "@/lib/telegram"

const BUCKET = "post-images"
const TELEGRAM_API = "https://api.telegram.org"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"])

/**
 * Download a photo from Telegram and upload it to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadFromTelegram(fileId: string): Promise<string> {
  const token = getToken()

  // 1. Get file path from Telegram
  const fileRes = await fetch(`${TELEGRAM_API}/bot${token}/getFile?file_id=${fileId}`)
  if (!fileRes.ok) {
    throw new Error(`Telegram getFile failed: ${fileRes.status}`)
  }
  const fileData = (await fileRes.json()) as {
    ok: boolean
    result: { file_path: string; file_size?: number }
  }
  if (!fileData.ok || !fileData.result.file_path) {
    throw new Error("Telegram getFile returned no file_path")
  }

  const filePath = fileData.result.file_path

  // 1b. Validate file size (if reported by Telegram)
  if (fileData.result.file_size && fileData.result.file_size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${Math.round(fileData.result.file_size / 1024 / 1024)}MB (max 5MB)`)
  }

  // 1c. Validate file extension
  const ext = filePath.split(".").pop()?.toLowerCase() || ""
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File type not allowed: .${ext}`)
  }

  // 2. Download the file binary
  const downloadRes = await fetch(
    `${TELEGRAM_API}/file/bot${token}/${filePath}`
  )
  if (!downloadRes.ok) {
    throw new Error(`Telegram file download failed: ${downloadRes.status}`)
  }
  const buffer = Buffer.from(await downloadRes.arrayBuffer())

  // 2b. Validate actual downloaded size
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(`Downloaded file too large: ${Math.round(buffer.byteLength / 1024 / 1024)}MB (max 5MB)`)
  }

  // 3. Determine content type from validated extension
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : "image/jpeg"

  // 4. Generate unique filename
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  // 5. Upload to Supabase Storage
  const supabase = getServiceClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType,
      upsert: false,
    })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  // 6. Return public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filename)

  return publicUrl
}
