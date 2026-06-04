import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const { topic } = await req.json()

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const messages: any[] = [{
    role: 'user',
    content: `Find monitoring sources for: "${topic}". Do ONE web search with query "best Reddit communities Twitter accounts ${topic} 2024" then immediately return JSON with subreddits, twitter_accounts, youtube_channels, news_keywords, summary fields.`
  }]

  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }]

  const system = `You are a market intelligence source discovery assistant for Signal Monster.
Your job is to find the most ACTIVE and RELEVANT communities for a specific monitoring topic.
Rules:
- Use web search to find real, currently active communities
- Prioritize niche communities dedicated to this exact topic over generic tech/AI communities
- NEVER suggest generic communities like r/artificial, r/technology, r/MachineLearning unless the topic is literally about those
- After searching, return ONLY valid JSON, no markdown, no explanation`

  // Tool loop — web search birden fazla tur gerektirebilir
  let finalText = ''
  for (let i = 0; i < 2; i++) {
    const response: any = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools,
      system,
      messages,
    })

    // Assistant mesajını history'e ekle
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.filter((b: any) => b.type === 'text').pop()
      finalText = textBlock?.text ?? ''
      break
    }

    if (response.stop_reason === 'tool_use') {
      // Tool result'ları topla ve history'e ekle
      const toolResults = response.content
        .filter((b: any) => b.type === 'tool_use')
        .map((b: any) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: b.input?.query ? `Search performed for: ${b.input.query}` : 'Search completed',
        }))
      messages.push({ role: 'user', content: toolResults })
    }
  }

  const clean = finalText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const sources = JSON.parse(clean)

    // Array içindeki object'leri string'e normalize et
    const normalize = (arr: any[]) => arr.map(item =>
      typeof item === 'string' ? item : (item.name || item.handle || item.channel || JSON.stringify(item))
    )

    const normalized = {
      subreddits: normalize(sources.subreddits || []),
      twitter_accounts: normalize(sources.twitter_accounts || []),
      youtube_channels: normalize(sources.youtube_channels || []),
      news_keywords: normalize(sources.news_keywords || []),
      summary: sources.summary || '',
    }

    return NextResponse.json(normalized)
  } catch (e) {
    console.error('DISCOVER ERROR:', e)
    console.error('FINAL TEXT:', finalText)
    console.error('MESSAGES:', JSON.stringify(messages, null, 2))
    return NextResponse.json({ error: 'Parse failed', raw: finalText }, { status: 500 })
  }
}
