import Anthropic from "@anthropic-ai/sdk"

let client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.REBIRTH_ANTHROPIC_KEY,
    })
  }
  return client
}
