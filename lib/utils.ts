import type { AlarmSchedule } from '@/types'

export function formatSchedule(schedule: AlarmSchedule): string {
  const time = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`

  if (schedule.type === 'daily') return `Her gün ${time}`
  if (schedule.type === 'weekly') {
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    const day = dayNames[schedule.days[0]] ?? ''
    return `Her ${day} ${time}`
  }
  if (schedule.days.length === 5 &&
    schedule.days.every(d => [1,2,3,4,5].includes(d))) {
    return `Hafta içi ${time}`
  }

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  const days = schedule.days.map(d => dayNames[d]).join(', ')
  return `${days} ${time}`
}

export function formatRelativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const past = diff < 0

  if (abs < 60_000) return past ? 'az önce' : 'şimdi'
  if (abs < 3_600_000) {
    const m = Math.round(abs / 60_000)
    return past ? `${m}dk önce` : `${m}dk sonra`
  }
  if (abs < 86_400_000) {
    const h = Math.round(abs / 3_600_000)
    return past ? `${h}sa önce` : `${h}sa sonra`
  }
  const d = Math.round(abs / 86_400_000)
  return past ? `${d}g önce` : `${d}g sonra`
}