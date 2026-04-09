import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"
import { generateDraft } from "@/lib/ai"

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

export const MCP_TOOLS: MCPTool[] = [
  {
    name: "create_draft",
    description: "Créer un brouillon de post LinkedIn avec titre, contenu, pilier et hashtags",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        pillar: { type: "string", enum: ["build_in_public", "vulgarisation", "retour_terrain"] },
        hashtags: { type: "array", items: { type: "string" } },
      },
      required: ["content"],
    },
    handler: async (args) => {
      const parsed = z.object({
        title: z.string().optional(),
        content: z.string(),
        pillar: z.enum(["build_in_public", "vulgarisation", "retour_terrain"]).optional(),
        hashtags: z.array(z.string()).optional(),
      }).parse(args)

      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: parsed.title || null,
          content: parsed.content,
          pillar: parsed.pillar || null,
          hashtags: parsed.hashtags || [],
          status: "draft",
          ai_generated: false,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "list_posts",
    description: "Lister les posts LinkedIn par statut (brouillon, prêt, programmé, publié, archivé)",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["idea", "draft", "ready", "scheduled", "published", "archived"] },
        limit: { type: "number" },
      },
    },
    handler: async (args) => {
      const status = args.status as string | undefined
      const limit = (args.limit as number) || 20
      const supabase = getServiceClient()
      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
      if (status) query = query.eq("status", status)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "get_post",
    description: "Récupérer le détail d'un post LinkedIn par son ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const id = z.string().parse(args.id)
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "update_post",
    description: "Modifier un post LinkedIn existant (contenu, statut, pilier, hashtags)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        pillar: { type: "string", enum: ["build_in_public", "vulgarisation", "retour_terrain"] },
        status: { type: "string", enum: ["idea", "draft", "ready", "scheduled", "published", "archived"] },
        hashtags: { type: "array", items: { type: "string" } },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const id = z.string().parse(args.id)
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (args.title !== undefined) updates.title = args.title
      if (args.content !== undefined) updates.content = args.content
      if (args.pillar !== undefined) updates.pillar = args.pillar
      if (args.status !== undefined) updates.status = args.status
      if (args.hashtags !== undefined) updates.hashtags = args.hashtags

      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "generate_draft",
    description: "Générer un brouillon de post LinkedIn par IA à partir d'un sujet, pilier et ton",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        pillar: { type: "string", enum: ["build_in_public", "vulgarisation", "retour_terrain"] },
        tone: { type: "string" },
      },
      required: ["topic", "pillar"],
    },
    handler: async (args) => {
      const topic = z.string().parse(args.topic)
      const pillar = z.enum(["build_in_public", "vulgarisation", "retour_terrain"]).parse(args.pillar)
      const tone = (args.tone as string) || "accessible"

      const stream = await generateDraft(topic, pillar, tone)
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let content = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }

      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: `[IA] ${topic.slice(0, 60)}`,
          content,
          pillar,
          status: "draft",
          ai_generated: true,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
]
