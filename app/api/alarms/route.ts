import { NextRequest, NextResponse } from 'next/server'
import { detectIntent, buildConfig } from '@/lib/intelligence'
import { supabaseAdmin } from '@/lib/supabase'
import type { AlarmSchedule, AlarmSources } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, topic, sources, schedule } = body

  const alarmSources: AlarmSources = {
    twitter_accounts: sources?.twitter_accounts ?? [],
    subreddits: sources?.subreddits ?? [],
    news_keywords: sources?.news_keywords ?? [],
    app_store_ids: [],
    youtube_channels: sources?.youtube_channels ?? [],
    custom_urls: sources?.custom_urls ?? [],
  }

  const intent = await detectIntent([{ step: 1, question: 'topic', answer: topic }])
  const configYaml = buildConfig(alarmSources, intent)
  const nextRun = computeNextRun(schedule)

  const db = supabaseAdmin()
  const { data, error } = await db.from('alarms').insert({
    name,
    status: 'active',
    intent,
    sources: alarmSources,
    schedule,
    config_yaml: configYaml,
    report_count: 0,
    next_run_at: nextRun.toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET() {
  const db = supabaseAdmin()
  const { data } = await db.from('alarms').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data)
}

function computeNextRun(schedule: AlarmSchedule): Date {
  const now = new Date()
  const next = new Date(now)
  next.setHours(schedule.hour, schedule.minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  while (!schedule.days.includes(next.getDay())) {
    next.setDate(next.getDate() + 1)
  }
  return next
}