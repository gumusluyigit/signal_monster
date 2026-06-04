'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function InvitePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Invite token URL'de hash olarak gelir
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else {
        // Hash'ten session oluştur
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            if (session) setReady(true)
          }
        })
      }
    })
  }, [])

  async function handleSetup() {
    setLoading(true)
    setError('')

    const { data: { user }, error: userError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName }
    })

    if (userError) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      setLoading(false)
      return
    }

    // Profili güncelle
    if (user) {
      await supabase.from('profiles').update({
        full_name: fullName,
      }).eq('id', user.id)
    }

    router.push('/alarms')
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 mb-12 justify-center">
          <div className="led-dot animate-pulse-led" />
          <span className="font-display text-3xl text-amber-led tracking-widest animate-flicker">
            SIGNAL MONSTER
          </span>
        </div>

        <div className="alarm-card p-8">
          <div className="card-led-top mb-8" />

          <h1 className="font-display text-2xl text-text-primary tracking-wide mb-1">
            HESABI OLUŞTUR
          </h1>
          <p className="font-mono text-xs text-text-muted mb-8">
            ScateAI ekibine hoş geldin
          </p>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs text-text-muted block mb-2">
                AD SOYAD
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Adın Soyadın"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg
                           px-4 py-3 text-sm text-text-primary font-mono
                           placeholder:text-text-muted
                           focus:outline-none focus:border-amber-dim focus:shadow-led-sm
                           transition-all duration-200"
              />
            </div>

            <div>
              <label className="font-mono text-xs text-text-muted block mb-2">
                ŞİFRE BELİRLE
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg
                           px-4 py-3 text-sm text-text-primary font-mono
                           placeholder:text-text-muted
                           focus:outline-none focus:border-amber-dim focus:shadow-led-sm
                           transition-all duration-200"
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-red-500">{error}</p>
            )}

            <button
              onClick={handleSetup}
              disabled={loading || !fullName || password.length < 8}
              className="w-full py-3 bg-amber-muted border border-amber-led text-amber-led
                         font-mono text-sm tracking-wider rounded-lg shadow-led-sm
                         hover:bg-amber-dim hover:shadow-led transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'OLUŞTURULUYOR...' : 'HESABI OLUŞTUR →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}