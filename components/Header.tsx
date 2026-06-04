import Link from 'next/link'

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-bg-border">
      <Link href="/alarms" className="flex items-center gap-3 group">
        <div className="led-dot group-hover:shadow-led transition-all duration-300" />
        <span className="font-display text-2xl text-amber-led tracking-widest animate-flicker">
          SIGNAL MONSTER
        </span>
      </Link>
      <span className="font-mono text-xs text-text-muted tracking-widest">
        SCATEAI
      </span>
    </header>
  )
}