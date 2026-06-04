import Link from 'next/link'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border border-amber-dim flex items-center justify-center">
          <div className="led-dot animate-pulse-led" />
        </div>
        <div className="absolute inset-0 rounded-full border border-amber-led opacity-20 animate-ping" />
      </div>

      <h2 className="font-display text-3xl text-text-primary tracking-wide mb-3">
        RADAR BOŞ
      </h2>
      <p className="font-mono text-sm text-text-muted max-w-xs leading-relaxed mb-8">
        Henüz alarm yok. İlk alarmını oluştur ve piyasayı izlemeye başla.
      </p>

      <Link
        href="/onboarding"
        className="px-6 py-3 bg-amber-muted border border-amber-led text-amber-led
                   font-mono text-sm tracking-wider rounded-lg shadow-led-sm
                   hover:bg-amber-dim hover:shadow-led transition-all duration-200"
      >
        + İLK ALARMI OLUŞTUR
      </Link>
    </div>
  )
}