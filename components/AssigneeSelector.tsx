'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getInitials } from './AuthProvider'

interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

interface AssigneeSelectorProps {
  alarmId: string
}

export default function AssigneeSelector({ alarmId }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [assigned, setAssigned] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProfiles()
    loadAssigned()
  }, [alarmId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadProfiles() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setProfiles((data as Profile[]) ?? [])
  }

  async function loadAssigned() {
    const { data } = await supabase
      .from('alarm_assignees')
      .select('profiles(*)')
      .eq('alarm_id', alarmId)
    const list = (data ?? []).map((d: any) => d.profiles).filter(Boolean)
    setAssigned(list as Profile[])
  }

  async function toggleAssign(profile: Profile) {
    const isAssigned = assigned.some(a => a.id === profile.id)
    if (isAssigned) {
      await supabase.from('alarm_assignees')
        .delete()
        .eq('alarm_id', alarmId)
        .eq('user_id', profile.id)
      setAssigned(prev => prev.filter(a => a.id !== profile.id))
    } else {
      await supabase.from('alarm_assignees')
        .insert({ alarm_id: alarmId, user_id: profile.id })
      setAssigned(prev => [...prev, profile])
    }
  }

  const filtered = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      {/* Assigned avatars + trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group"
      >
        <div className="flex -space-x-2">
          {assigned.length === 0 && (
            <div className="w-7 h-7 rounded-full border border-dashed border-bg-border
                            flex items-center justify-center
                            group-hover:border-amber-dim transition-colors">
              <span className="text-text-muted text-xs">+</span>
            </div>
          )}
          {assigned.slice(0, 4).map(a => (
            <Avatar key={a.id} profile={a} size="sm" />
          ))}
          {assigned.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-bg-elevated border border-bg-border
                            flex items-center justify-center">
              <span className="font-mono text-xs text-text-muted">+{assigned.length - 4}</span>
            </div>
          )}
        </div>
        {assigned.length === 0 && (
          <span className="font-mono text-xs text-text-muted group-hover:text-amber-led transition-colors">
            Atama yap
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-10 left-0 z-50 w-72 alarm-card animate-fade-in">
          <div className="card-led-top" />
          <div className="p-3">
            {/* Search */}
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="İsim veya e-posta ara..."
              className="w-full bg-bg-base border border-bg-border rounded-lg
                         px-3 py-2 text-sm text-text-primary font-mono
                         placeholder:text-text-muted
                         focus:outline-none focus:border-amber-dim
                         transition-all duration-200 mb-3"
            />

            {/* List */}
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="font-mono text-xs text-text-muted text-center py-4">
                  Kullanıcı bulunamadı
                </p>
              )}
              {filtered.map(profile => {
                const isAssigned = assigned.some(a => a.id === profile.id)
                return (
                  <button
                    key={profile.id}
                    onClick={() => toggleAssign(profile)}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg
                                transition-all duration-150 text-left
                                ${isAssigned
                                  ? 'bg-amber-muted'
                                  : 'hover:bg-bg-elevated'}`}
                  >
                    <Avatar profile={profile} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate
                                     ${isAssigned ? 'text-amber-led' : 'text-text-primary'}`}>
                        {profile.full_name || profile.email}
                      </p>
                      <p className="font-mono text-xs text-text-muted truncate">
                        {profile.email}
                      </p>
                    </div>
                    {isAssigned && (
                      <div className="led-dot-sm shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Divider + count */}
            {assigned.length > 0 && (
              <div className="mt-3 pt-3 border-t border-bg-border">
                <p className="font-mono text-xs text-text-muted">
                  {assigned.length} kişi atandı
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ profile, size }: { profile: Profile; size: 'sm' | 'md' }) {
  const [imgError, setImgError] = useState(false)
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'
  const initials = getInitials(profile.full_name || profile.email || '?')

  const gravatarUrl = `https://www.gravatar.com/avatar/${
    Array.from(profile.email?.trim().toLowerCase() ?? '')
      .reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)
      .toString(16).replace('-', '')
  }?d=404&s=80`

  if (profile.avatar_url && !imgError) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name}
        onError={() => setImgError(true)}
        className={`${dim} rounded-full object-cover border border-bg-border`}
      />
    )
  }

  if (!imgError) {
    return (
      <img
        src={gravatarUrl}
        alt={profile.full_name}
        onError={() => setImgError(true)}
        className={`${dim} rounded-full object-cover border border-bg-border`}
      />
    )
  }

  return (
    <div className={`${dim} rounded-full bg-amber-muted border border-amber-dim
                     flex items-center justify-center font-mono font-medium text-amber-led`}>
      {initials}
    </div>
  )
}