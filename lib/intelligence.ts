import Anthropic from '@anthropic-ai/sdk'
import yaml from 'js-yaml'
import type { AlarmIntent, AlarmSources, AlarmSchedule } from '@/types'
import type { OnboardingAnswer } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function detectIntent(answers: OnboardingAnswer[]): Promise<AlarmIntent> {
  const answersText = answers
    .map(a => `Q: ${a.question}\nA: ${Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}`)
    .join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    system: `You are an intent classification system for a market intelligence alarm platform called Signal Monster.
Given a user's onboarding answers, extract their alarm intent as JSON.
Return ONLY valid JSON, no markdown, no explanation.`,
    messages: [{
      role: 'user',
      content: `Onboarding answers:\n\n${answersText}\n\nReturn JSON matching this exact shape:
{
  "summary": "one sentence describing what this alarm monitors",
  "focus": ["array", "of", "focus", "tags"],
  "report_tone": "executive" | "detailed" | "technical",
  "report_format": "bullets" | "narrative" | "structured"
}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(clean) as AlarmIntent
}

export function buildConfig(sources: AlarmSources, intent: AlarmIntent): string {
  const config = {
    signal_hunter: {
      intent_summary: intent.summary,
      focus_areas: intent.focus,
      sources: {
        twitter: {
          enabled: sources.twitter_accounts.length > 0,
          accounts: sources.twitter_accounts,
        },
        reddit: {
          enabled: sources.subreddits.length > 0,
          subreddits: sources.subreddits.map(s => s.replace(/^r\//, '')),
        },
        news: {
          enabled: sources.news_keywords.length > 0,
          keywords: sources.news_keywords,
        },
        app_store: {
          enabled: sources.app_store_ids.length > 0,
          app_ids: sources.app_store_ids,
        },
        youtube: {
          enabled: sources.youtube_channels.length > 0,
          channels: sources.youtube_channels,
        },
      },
      output: {
        format: 'json',
        report_tone: intent.report_tone,
        report_format: intent.report_format,
      },
    },
    scoring: {
      relevance_keywords: {
        boost_high: intent.focus,
        boost_low: sources.news_keywords,
        dampener: ['meme', 'lol', 'shitpost', 'spam', 'low quality'],
      },
      cross_source_multiplier: 1.5,
      newsletter_mention_bonus: 15,
      velocity: {
        lookback_days: 7,
        acceleration_threshold: 2.0,
        fading_threshold: 0.5,
      },
    },
  }
  return yaml.dump(config, { lineWidth: 120 })
}

export async function generateReport(
  rawSignals: string,
  intent: AlarmIntent,
  alarmName: string,
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    system: `You are a market intelligence analyst for ScateAI.
You receive raw signals collected by Signal Hunter and produce a focused report.
Alarm intent: ${intent.summary}
Focus areas: ${intent.focus.join(', ')}
Report tone: ${intent.report_tone}
Report format: ${intent.report_format}
Write in Turkish unless signals are entirely English.`,
    messages: [{
      role: 'user',
      content: `Alarm: ${alarmName}\n\nRaw signals:\n${rawSignals}\n\nGenerate the intelligence report.`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export function parseAnswersToSources(answers: OnboardingAnswer[]): AlarmSources {
  const get = (keyword: string) =>
    answers.find(a => a.question.includes(keyword))?.answer ?? ''

  const split = (val: string | string[]) =>
    typeof val === 'string'
      ? val.split(',').map(s => s.trim()).filter(Boolean)
      : val

  return {
    twitter_accounts: split(get('Twitter') as string),
    subreddits: split(get('Reddit') as string),
    news_keywords: split(get('Haber') as string),
    app_store_ids: split(get('App Store') as string),
    youtube_channels: split(get('YouTube') as string),
    custom_urls: split(get('Manuel') as string),
  }
}