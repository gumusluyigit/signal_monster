export type AlarmStatus = 'active' | 'paused' | 'pending'
export type ScheduleType = 'daily' | 'weekly' | 'custom'

export interface AlarmSchedule {
  type: ScheduleType
  days: number[]
  hour: number
  minute: number
  timezone: string
}

export interface AlarmSources {
  twitter_accounts: string[]
  subreddits: string[]
  news_keywords: string[]
  app_store_ids: string[]
  youtube_channels: Array<string | { name: string; handle?: string }>
  custom_urls: string[]
}

export interface AlarmIntent {
  summary: string
  focus: string[]
  report_tone: 'executive' | 'detailed' | 'technical'
  report_format: 'bullets' | 'narrative' | 'structured'
}

export interface Alarm {
  id: string
  name: string
  status: AlarmStatus
  intent: AlarmIntent
  sources: AlarmSources
  schedule: AlarmSchedule
  created_at: string
  last_run_at: string | null
  next_run_at: string | null
  report_count: number
}

export interface OnboardingAnswer {
  step: number
  question: string
  answer: string | string[]
}

export interface Report {
  id: string
  alarm_id: string
  created_at: string
  content: string
  sources_used: string[]
  signal_count: number
}