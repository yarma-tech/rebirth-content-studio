import { NextRequest, NextResponse } from "next/server"
import { MCP_TOOLS } from "@/lib/mcp/tools"

// MCP Server v1 — JSON-RPC over HTTP
// Supports: initialize, tools/list, tools/call
// SSE transport will be added when the MCP SDK stabilizes for Next.js edge

function jsonRpcResponse(id: string | number | null, result: unknown) {
  return { jsonrpc: "2.0", id, result }
}

function jsonRpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } }
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization")
  const expectedToken = process.env.MCP_AUTH_TOKEN
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      jsonRpcError(null, -32600, "Unauthorized"),
      { status: 401 }
    )
  }

  let body: { jsonrpc?: string; method?: string; params?: Record<string, unknown>; id?: string | number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      jsonRpcError(null, -32700, "Parse error"),
      { status: 400 }
    )
  }

  const { method, params, id } = body

  switch (method) {
    case "initialize": {
      return NextResponse.json(
        jsonRpcResponse(id ?? null, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "rebirth-content-studio",
            version: "1.0.0",
          },
        })
      )
    }

    case "tools/list": {
      const tools = MCP_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }))
      return NextResponse.json(jsonRpcResponse(id ?? null, { tools }))
    }

    case "tools/call": {
      const toolName = (params as Record<string, unknown>)?.name as string
      const toolArgs = (params as Record<string, unknown>)?.arguments as Record<string, unknown> ?? {}
      const tool = MCP_TOOLS.find((t) => t.name === toolName)

      if (!tool) {
        return NextResponse.json(
          jsonRpcError(id ?? null, -32601, `Tool not found: ${toolName}`)
        )
      }

      try {
        const result = await tool.handler(toolArgs)
        return NextResponse.json(
          jsonRpcResponse(id ?? null, {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          })
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool execution failed"
        return NextResponse.json(
          jsonRpcResponse(id ?? null, {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
          })
        )
      }
    }

    default: {
      return NextResponse.json(
        jsonRpcError(id ?? null, -32601, `Method not found: ${method}`)
      )
    }
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    name: "rebirth-content-studio-mcp",
    version: "1.0.0",
    status: "ok",
    tools: MCP_TOOLS.map((t) => t.name),
  })
}
