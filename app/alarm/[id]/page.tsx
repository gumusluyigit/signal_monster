'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Alarm, Report } from '@/types'
import Header from '@/components/Header'
import { formatSchedule, formatRelativeTime } from '@/lib/utils'
import AssigneeSelector from '@/components/AssigneeSelector'

export default function AlarmDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [alarm, setAlarm] = useState<Alarm | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [reportRows, setReportRows] = useState<any[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: a, error: e1 }, { data: r }] = await Promise.all([
        supabase.from('alarms').select('*').eq('id', id).single(),
        supabase.from('reports').select('*').eq('alarm_id', id)
          .order('created_at', { ascending: false }).limit(10),
      ])
      if (e1) { console.error('Alarm yüklenemedi:', e1); setLoading(false); return; }
      setAlarm(a as Alarm)
      setReports((r as Report[]) ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function toggleStatus() {
    if (!alarm) return
    setToggling(true)
    const newStatus = alarm.status === 'active' ? 'paused' : 'active'
    await supabase.from('alarms').update({ status: newStatus }).eq('id', id)
    setAlarm({ ...alarm, status: newStatus })
    setToggling(false)
  }

  async function deleteAlarm() {
    if (!confirm('Bu alarmı silmek istediğine emin misin?')) return
    await supabase.from('alarms').delete().eq('id', id)
    router.push('/alarms')
  }

  async function handleRun() {
    setRunning(true)
    setRunResult(null)
    setReportRows([])
    try {
      const res = await fetch('/api/run-alarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarm }),
      })
      const data = await res.json()
      if (res.ok && data.rows) {
        setReportRows(data.rows)
        setRunResult(`✓ ${data.rows.length} sinyal bulundu.`)
      } else {
        setRunResult('✗ Hata: ' + (data.error ?? 'bilinmeyen hata'))
      }
    } catch (e) {
      setRunResult('✗ Signal Hunter bağlantı hatası')
    } finally {
      setRunning(false)
    }
  }

  if (loading || !alarm) return <LoadingState />

  const statusColor = alarm.status === 'active'
    ? 'text-amber-led'
    : alarm.status === 'paused'
    ? 'text-text-muted'
    : 'text-text-secondary'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted mb-6">
          <Link href="/alarms" className="hover:text-amber-led transition-colors">ALARMLAR</Link>
          <span>/</span>
          <span className="text-text-secondary">{alarm.name.toUpperCase()}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={`led-dot-sm ${alarm.status === 'active' ? 'animate-pulse-led' : 'opacity-30'}`} />
              <span className={`font-mono text-xs tracking-widest uppercase ${statusColor}`}>
                {alarm.status}
              </span>
            </div>
            <h1 className="font-display text-4xl text-text-primary tracking-wide">
              {alarm.name.toUpperCase()}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1">
            <button
              onClick={toggleStatus}
              disabled={toggling}
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-wider border
                         border-bg-border text-text-secondary hover:border-amber-dim hover:text-amber-led
                         transition-all duration-200 disabled:opacity-40"
            >
              {alarm.status === 'active' ? 'DURDUR' : 'BAŞLAT'}
            </button>
            <button
              onClick={deleteAlarm}
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-wider border
                         border-bg-border text-text-muted hover:border-red-900 hover:text-red-500
                         transition-all duration-200"
            >
              SİL
            </button>
          </div>
        </div>
      </div>

      <div className="mx-8 led-line mb-8" />

      <main className="flex-1 px-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Section title="INTENT">
            <p className="text-text-secondary text-sm leading-relaxed">
              {alarm.intent.summary}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {alarm.intent.focus.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded font-mono text-xs
                  bg-amber-muted text-amber-led border border-amber-dim">
                  {tag}
                </span>
              ))}
            </div>
          </Section>

          <Section title="ZAMANLAMA">
            <p className="font-mono text-sm text-amber-glow">
              {formatSchedule(alarm.schedule)}
            </p>
            {alarm.next_run_at && (
              <p className="text-text-muted text-xs mt-1 font-mono">
                Sonraki: {formatRelativeTime(alarm.next_run_at)}
              </p>
            )}
          </Section>

          <Section title="KAYNAKLAR">
            <SourceList label="Twitter/X" items={alarm.sources.twitter_accounts} />
            <SourceList label="Reddit" items={alarm.sources.subreddits} />
            <SourceList label="Haberler" items={alarm.sources.news_keywords} />
            <SourceList label="App Store" items={alarm.sources.app_store_ids} />
          </Section>

          <Section title="İSTATİSTİKLER">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Rapor" value={alarm.report_count} />
              <Stat label="Son çalışma" value={alarm.last_run_at ? formatRelativeTime(alarm.last_run_at) : '—'} />
            </div>
          </Section>
          <Section title="ATANANLAR">
            <AssigneeSelector alarmId={alarm.id} />
          </Section>
        </div>

        <div className="lg:col-span-2">
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            {running ? '⏳ Çalışıyor...' : '▶ Şimdi Çalıştır'}
          </button>
          {runResult && (
            <p className="text-sm mt-2 text-gray-400">{runResult}</p>
          )}

          {reportRows.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Platform', 'Kaynak', 'Konu', 'İçerik', 'URL', 'Fırsat', 'Topluluk'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-gray-500 font-mono text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-900 hover:bg-gray-900/50">
                      <td className="py-3 px-3 text-gray-400 text-xs">{row.platform}</td>
                      <td className="py-3 px-3 text-orange-400 text-xs font-mono">{row.source}</td>
                      <td className="py-3 px-3 text-white text-xs font-medium">{row.topic}</td>
                      <td className="py-3 px-3 text-gray-300 text-xs max-w-xs">{row.post?.slice(0, 200)}{row.post?.length > 200 ? '…' : ''}</td>
                      <td className="py-3 px-3 text-xs">
                        {row.url && <a href={row.url} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300 underline">↗</a>}
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-xs max-w-xs">{row.product_depth}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs max-w-xs">{row.community_voice?.slice(0, 150)}{row.community_voice?.length > 150 ? '…' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="font-mono text-xs tracking-widest text-text-muted uppercase mb-4 mt-8">
            RAPORLAR
          </h2>

          {reports.length === 0 ? (
            <div className="alarm-card p-8 text-center">
              <div className="card-led-top" />
              <p className="text-text-muted font-mono text-sm mt-4">
                Henüz rapor yok. Alarm bir sonraki zamanında çalışacak.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="alarm-card p-5">
      <div className="card-led-top mb-4" />
      <h3 className="font-mono text-xs tracking-widest text-text-muted uppercase mb-3">{title}</h3>
      {children}
    </div>
  )
}

function SourceList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="mb-3">
      <p className="font-mono text-xs text-text-muted mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map(item => (
          <span key={item} className="px-2 py-0.5 rounded font-mono text-xs
            bg-bg-elevated text-text-secondary border border-bg-border">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-mono text-xs text-text-muted">{label}</p>
      <p className="font-mono text-sm text-text-primary mt-0.5">{value}</p>
    </div>
  )
}

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="alarm-card">
      <div className="card-led-top" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-text-muted">
            {new Date(report.created_at).toLocaleString('tr-TR')}
          </span>
          <span className="font-mono text-xs text-amber-led">
            {report.signal_count} sinyal
          </span>
        </div>
        <p className={`text-text-secondary text-sm leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {report.content}
        </p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 font-mono text-xs text-text-muted hover:text-amber-led transition-colors"
        >
          {expanded ? 'DARALT' : 'TAMAMINI GÖR'}
        </button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="led-dot animate-pulse" />
      </div>
    </div>
  )
}