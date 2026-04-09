import { NextRequest, NextResponse } from "next/server"
import { getVeilleSources, saveVeilleSources, type VeilleSource } from "@/lib/veille-sources"

export async function GET() {
  const sources = await getVeilleSources()
  return NextResponse.json({ sources })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const sources = body.sources as VeilleSource[]

  if (!Array.isArray(sources)) {
    return NextResponse.json({ error: "sources must be an array" }, { status: 400 })
  }

  // Validate each source
  for (const s of sources) {
    if (!s.name || !s.url || !s.category || !s.language || !s.type) {
      return NextResponse.json(
        { error: `Source invalide: ${s.name || "sans nom"} — tous les champs sont requis` },
        { status: 400 }
      )
    }
  }

  await saveVeilleSources(sources)
  return NextResponse.json({ sources })
}
