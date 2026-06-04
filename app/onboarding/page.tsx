'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import type { OnboardingAnswer } from '@/types'

type Step = 1 | 2 | 3 | 4 | 5

type DiscoverResponse = {
  subreddits: string[]
  twitter_accounts: string[]
  youtube_channels: string[]
  news_keywords: string[]
}

type SourcesState = DiscoverResponse & {
  summary: string
}

type SourceKey = keyof DiscoverResponse

type ScheduleType = 'daily' | 'weekdays' | 'weekly'

const STEP_LABELS: Record<Step, string> = {
  1: 'TOPIC',
  2: 'DISCOVER',
  3: 'SOURCES',
  4: 'SCHEDULE',
  5: 'CREATE',
}

const SOURCE_META: Array<{ key: SourceKey; title: string; hint: string; placeholder: string }> = [
  { key: 'subreddits', title: 'Subreddits', hint: 'Örn: r/SunoAI', placeholder: 'r/SunoAI' },
  { key: 'twitter_accounts', title: 'Twitter/X hesapları', hint: 'Örn: @suno', placeholder: '@suno' },
  { key: 'youtube_channels', title: 'YouTube kanalları', hint: 'Örn: @SunoOfficial', placeholder: '@SunoOfficial' },
  { key: 'news_keywords', title: 'News keywords', hint: 'Örn: AI music funding', placeholder: 'AI music funding' },
]

function uniq(items: string[]) {
  return Array.from(new Set(items.map(s => s.trim()).filter(Boolean)))
}

function joinCsv(items: string[]) {
  return uniq(items).join(', ')
}

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)

  const [topic, setTopic] = useState('')

  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState<string | null>(null)
  const [sources, setSources] = useState<SourcesState>({
    subreddits: [],
    twitter_accounts: [],
    youtube_channels: [],
    news_keywords: [],
    summary: '',
  })

  const [selected, setSelected] = useState<DiscoverResponse>({
    subreddits: [],
    twitter_accounts: [],
    youtube_channels: [],
    news_keywords: [],
  })

  const [manualInputs, setManualInputs] = useState<Record<SourceKey, string>>({
    subreddits: '',
    twitter_accounts: '',
    youtube_channels: '',
    news_keywords: '',
  })

  const [schedule, setSchedule] = useState({
    type: 'daily' as 'daily' | 'weekly' | 'custom',
    days: [0, 1, 2, 3, 4, 5, 6] as number[],
    hour: 9,
    minute: 0,
    timezone: 'Europe/Istanbul',
  })

  const [alarmName, setAlarmName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const progressIndex = (step - 1) / 4

  const totalSelectedCount = useMemo(() => {
    return (
      selected.subreddits.length +
      selected.twitter_accounts.length +
      selected.youtube_channels.length +
      selected.news_keywords.length
    )
  }, [selected])

  function toggleSelected(key: SourceKey, value: string) {
    setSelected(prev => {
      const cur = prev[key]
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]
      return { ...prev, [key]: next }
    })
  }

  function addManual(key: SourceKey) {
    const raw = manualInputs[key].trim()
    if (!raw) return

    const split = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    setSelected(prev => ({ ...prev, [key]: uniq([...prev[key], ...split]) }))
    setManualInputs(prev => ({ ...prev, [key]: '' }))
  }

  function removeSelected(key: SourceKey, value: string) {
    setSelected(prev => ({ ...prev, [key]: prev[key].filter(v => v !== value) }))
  }

  async function runDiscover() {
    setDiscoverError(null)
    setDiscoverLoading(true)
    setStep(2)

    try {
      const res = await fetch('/api/alarms/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? `Discover failed (${res.status})`)
      }

      setSources({
        subreddits: Array.isArray(data.subreddits) ? data.subreddits : [],
        twitter_accounts: Array.isArray(data.twitter_accounts) ? data.twitter_accounts : [],
        youtube_channels: Array.isArray(data.youtube_channels) ? data.youtube_channels : [],
        news_keywords: Array.isArray(data.news_keywords) ? data.news_keywords : [],
        summary: typeof data.summary === 'string' ? data.summary : '',
      })

      setSelected({
        subreddits: Array.isArray(data.subreddits) ? data.subreddits : [],
        twitter_accounts: Array.isArray(data.twitter_accounts) ? data.twitter_accounts : [],
        youtube_channels: Array.isArray(data.youtube_channels) ? data.youtube_channels : [],
        news_keywords: Array.isArray(data.news_keywords) ? data.news_keywords : [],
      })
      setStep(3)
    } catch (e) {
      setDiscoverError(e instanceof Error ? e.message : 'Bir hata oluştu')
    } finally {
      setDiscoverLoading(false)
    }
  }

  function canGoNext() {
    if (step === 1) return topic.trim().length > 0
    if (step === 2) return false
    if (step === 3) return totalSelectedCount > 0
    if (step === 4) return schedule.days.length > 0
    if (step === 5) return alarmName.trim().length > 0 && totalSelectedCount > 0
    return false
  }

  async function createAlarm() {
    setCreateError(null)
    setCreating(true)
    try {
      const res = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: alarmName.trim(),
          topic: topic.trim(),
          sources: {
            subreddits: selected.subreddits,
            twitter_accounts: selected.twitter_accounts,
            youtube_channels: selected.youtube_channels,
            news_keywords: selected.news_keywords,
            custom_urls: [],
          },
          schedule,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? `Create failed (${res.status})`)
      }

      const data = await res.json()
      router.push(`/alarm/${data.id}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Bir hata oluştu')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-mono text-xs text-text-muted">ONBOARDING</div>
              <div className="text-text-primary text-lg font-light">
                {step === 1 && 'Ne takip etmek istiyorsun?'}
                {step === 2 && 'Kaynaklar aranıyor...'}
                {step === 3 && 'Kaynakları seç'}
                {step === 4 && 'Schedule seç'}
                {step === 5 && 'Alarmı oluştur'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="font-mono text-xs text-text-muted">{STEP_LABELS[step]}</div>
              <div className="w-24 h-1 bg-bg-border rounded overflow-hidden">
                <div
                  className="h-full bg-amber-led shadow-led-sm transition-all duration-300"
                  style={{ width: `${Math.round(progressIndex * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 animate-slide-up">
          {step === 1 && (
            <div className="alarm-card p-6">
              <div className="card-led-top mb-5" />
              <div className="font-mono text-xs text-text-muted mb-3">
                Örn: “AI Music”, “Rakip uygulama: Suno”
              </div>
              <input
                autoFocus
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ne takip etmek istiyorsun?"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg
                           px-4 py-3 text-sm text-text-primary font-mono
                           placeholder:text-text-muted
                           focus:outline-none focus:border-amber-dim focus:shadow-led-sm
                           transition-all duration-200"
              />
            </div>
          )}

          {step === 2 && (
            <div className="alarm-card p-6">
              <div className="card-led-top mb-5" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-text-primary font-light">Kaynaklar aranıyor...</div>
                  <div className="font-mono text-xs text-text-muted mt-1">
                    Topic: <span className="text-text-secondary">{topic}</span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-glow shadow-led animate-pulse-led" />
              </div>

              {discoverError && (
                <div className="mt-4 border border-red-500/30 bg-red-500/10 rounded-lg p-3">
                  <div className="font-mono text-xs text-red-300">{discoverError}</div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <>
              {SOURCE_META.map(({ key, title, hint, placeholder }) => (
                <div key={key} className="alarm-card p-6">
                  <div className="card-led-top mb-5" />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-text-primary font-light">{title}</div>
                      <div className="font-mono text-xs text-text-muted mt-1">{hint}</div>
                    </div>
                    <div className="font-mono text-xs text-text-muted">
                      {(selected[key] ?? []).length} seçili
                    </div>
                  </div>

                  {(sources[key] ?? []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sources[key].map(item => {
                        const checked = selected[key].includes(item)
                        return (
                          <label
                            key={item}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
                              ${checked
                                ? 'bg-amber-muted border-amber-led text-amber-led shadow-led-sm'
                                : 'bg-bg-elevated border-bg-border text-text-secondary hover:border-amber-dim'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelected(key, item)}
                              className="accent-amber-led"
                            />
                            <span className="font-mono text-sm">{item}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={manualInputs[key]}
                      onChange={e => setManualInputs(prev => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addManual(key)
                        }
                      }}
                      placeholder={`Manuel ekle (virgülle ayır): ${placeholder}`}
                      className="flex-1 bg-bg-elevated border border-bg-border rounded-lg
                                 px-4 py-2.5 text-sm text-text-primary font-mono
                                 placeholder:text-text-muted
                                 focus:outline-none focus:border-amber-dim focus:shadow-led-sm
                                 transition-all duration-200"
                    />
                    <button
                      onClick={() => addManual(key)}
                      className="px-4 py-2.5 font-mono text-sm bg-bg-elevated border border-bg-border
                                 text-text-secondary rounded-lg hover:border-amber-dim hover:text-text-primary transition-all"
                    >
                      Ekle
                    </button>
                  </div>

                  {(selected[key] ?? []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selected[key].map(item => (
                        <button
                          key={item}
                          onClick={() => removeSelected(key, item)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded
                                     bg-amber-muted border border-amber-dim
                                     text-amber-led font-mono text-xs hover:bg-amber-dim transition-colors"
                        >
                          <span>{item}</span>
                          <span className="text-text-muted">×</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {step === 4 && (
            <div className="alarm-card p-6">
              <div className="card-led-top mb-5" />

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Frekans</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'daily', label: 'Her gün', days: [0,1,2,3,4,5,6] },
                      { key: 'weekdays', label: 'Hafta içi', days: [1,2,3,4,5] },
                      { key: 'custom', label: 'Belirli günler', days: [] },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setSchedule(s => ({
                          ...s,
                          type: opt.key === 'custom' ? 'custom' : 'daily',
                          days: opt.key === 'custom' ? [] : opt.days,
                        }))}
                        className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                          (opt.key === 'daily' && schedule.days.length === 7) ||
                          (opt.key === 'weekdays' && schedule.days.length === 5 && !schedule.days.includes(0)) ||
                          (opt.key === 'custom' && schedule.days.length !== 7 && schedule.days.length !== 5)
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-3">Günler</label>
                  <div className="grid grid-cols-7 gap-2">
                    {[{day:1,label:'Pzt'},{day:2,label:'Sal'},{day:3,label:'Çar'},{day:4,label:'Per'},{day:5,label:'Cum'},{day:6,label:'Cmt'},{day:0,label:'Paz'}].map(({ day, label }) => (
                      <button
                        key={day}
                        onClick={() => setSchedule(s => ({
                          ...s,
                          type: 'custom',
                          days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day],
                        }))}
                        className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                          schedule.days.includes(day)
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-3">Saat <span className="text-gray-600">(İstanbul)</span></label>
                  <div className="flex items-center gap-3">
                    <select
                      value={schedule.hour}
                      onChange={e => setSchedule(s => ({ ...s, hour: parseInt(e.target.value) }))}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none"
                    >
                      {Array.from({length: 24}, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span className="text-gray-500 text-lg">:</span>
                    <select
                      value={schedule.minute}
                      onChange={e => setSchedule(s => ({ ...s, minute: parseInt(e.target.value) }))}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none"
                    >
                      {[0, 15, 30, 45].map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="alarm-card p-6">
              <div className="card-led-top mb-5" />

              <div className="font-mono text-xs text-text-muted mb-3">
                Seçili kaynak: <span className="text-text-secondary">{totalSelectedCount}</span>
              </div>

              <input
                autoFocus
                type="text"
                value={alarmName}
                onChange={e => setAlarmName(e.target.value)}
                placeholder="Alarm ismi"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg
                           px-4 py-3 text-sm text-text-primary font-mono
                           placeholder:text-text-muted
                           focus:outline-none focus:border-amber-dim focus:shadow-led-sm
                           transition-all duration-200"
              />

              {createError && (
                <div className="mt-4 border border-red-500/30 bg-red-500/10 rounded-lg p-3">
                  <div className="font-mono text-xs text-red-300">{createError}</div>
                </div>
              )}

              <div className="mt-5 border-t border-bg-border pt-5">
                <div className="font-mono text-xs text-text-muted mb-2">Özet</div>
                <div className="text-text-secondary text-sm font-mono">
                  <div>Topic: {topic || '-'}</div>
                  <div>
                    Schedule: {schedule.type} [{schedule.days.slice().sort((a, b) => a - b).join(',')}] @{' '}
                    {String(schedule.hour).padStart(2, '0')}:{String(schedule.minute).padStart(2, '0')}
                  </div>
                  <div>Reddit: {selected.subreddits.length}</div>
                  <div>X: {selected.twitter_accounts.length}</div>
                  <div>YouTube: {selected.youtube_channels.length}</div>
                  <div>News: {selected.news_keywords.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-bg-border">
          <button
            onClick={() => {
              if (step === 2) return
              setStep(s => (s > 1 ? ((s - 1) as Step) : s))
            }}
            disabled={step === 1 || step === 2 || discoverLoading || creating}
            className="px-5 py-2.5 font-mono text-sm text-text-muted border border-bg-border rounded-lg
                       hover:text-text-secondary hover:border-text-muted transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← GERİ
          </button>

          {step < 5 ? (
            <button
              onClick={() => {
                if (step === 1) runDiscover()
                else setStep(s => ((s + 1) as Step))
              }}
              disabled={!canGoNext() || discoverLoading}
              className="px-6 py-2.5 font-mono text-sm bg-amber-muted border border-amber-led
                         text-amber-led rounded-lg shadow-led-sm
                         hover:bg-amber-dim hover:shadow-led transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {step === 1 ? 'KAYNAKLARI BUL →' : 'İLERİ →'}
            </button>
          ) : (
            <button
              onClick={createAlarm}
              disabled={!canGoNext() || creating}
              className="px-6 py-2.5 font-mono text-sm bg-amber-muted border border-amber-led
                         text-amber-led rounded-lg shadow-led-sm
                         hover:bg-amber-dim hover:shadow-led transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {creating ? 'OLUŞTURULUYOR...' : 'OLUŞTUR →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
