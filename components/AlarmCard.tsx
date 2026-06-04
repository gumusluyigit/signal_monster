import Link from 'next/link'
import type { Alarm } from '@/types'
import { formatSchedule, formatRelativeTime } from '@/lib/utils'

export default function AlarmCard({ alarm }: { alarm: Alarm }) {
  const isActive = alarm.status === 'active'

  return (
    <Link href={`/alarm/${alarm.id}`} className="alarm-card block">
      <div className="card-led-top" />
      <div className="p-5">

        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`led-dot-sm ${isActive ? 'animate-pulse-led' : 'opacity-20'}`} />
              <span className={`font-mono text-xs tracking-widest ${isActive ? 'text-amber-led' : 'text-text-muted'}`}>
                {alarm.status.toUpperCase()}
              </span>
            </div>
            <h2 className="font-display text-xl text-text-primary tracking-wide leading-tight">
              {alarm.name.toUpperCase()}
            </h2>
          </div>
          <span className="font-mono text-xs text-text-muted shrink-0 mt-1">
            {alarm.report_count} rapor
          </span>
        </div>

        <p className="text-text-muted text-xs leading-relaxed mb-4 line-clamp-2">
          {alarm.intent.summary}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          {alarm.sources.twitter_accounts.length > 0 && (
            <SourceChip label={`𝕏 ${alarm.sources.twitter_accounts.length}`} />
          )}
          {alarm.sources.subreddits.length > 0 && (
            <SourceChip label={`Reddit ${alarm.sources.subreddits.length}`} />
          )}
          {alarm.sources.news_keywords.length > 0 && (
            <SourceChip label="Haberler" />
          )}
          {alarm.sources.app_store_ids.length > 0 && (
            <SourceChip label={`App Store ${alarm.sources.app_store_ids.length}`} />
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-bg-border">
          <span className="font-mono text-xs text-text-muted">
            {formatSchedule(alarm.schedule)}
          </span>
          {alarm.next_run_at && (
            <span className="font-mono text-xs text-text-muted">
              → {formatRelativeTime(alarm.next_run_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SourceChip({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded font-mono text-xs bg-bg-elevated text-text-muted border border-bg-border">
      {label}
    </span>
  )
}