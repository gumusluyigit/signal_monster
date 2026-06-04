'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { Alarm } from '@/types'
import AlarmCard from '@/components/AlarmCard'
import EmptyState from '@/components/EmptyState'
import Header from '@/components/Header'


export default function AlarmsPage() {
  const { session, loading: authLoading } = useAuth()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('alarms')
        .select('*')
        .order('created_at', { ascending: false })
      setAlarms((data as Alarm[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (authLoading) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="px-8 pt-10 pb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-2">
            ScateAI / Signal Monster
          </p>
          <h1 className="font-display text-5xl text-text-primary tracking-wide">
            ALARMLAR
          </h1>
        </div>

        <Link
          href="/onboarding"
          className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-muted border border-amber-dim
                     text-amber-led font-mono text-sm tracking-wider
                     hover:bg-amber-dim hover:border-amber-led hover:shadow-led-sm transition-all duration-200"
        >
          <span className="text-lg leading-none">+</span>
          <span>YENİ ALARM</span>
        </Link>
      </div>

      <div className="mx-8 led-line mb-8" />

      <main className="flex-1 px-8 pb-12">
        {loading ? (
          <LoadingSkeleton />
        ) : alarms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {alarms.map(alarm => (
              <AlarmCard key={alarm.id} alarm={alarm} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="alarm-card h-48 animate-pulse">
          <div className="card-led-top opacity-30" />
        </div>
      ))}
    </div>
  )
}