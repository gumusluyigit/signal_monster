import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const alarmFromBody = body?.alarm
  const alarmId = body?.alarm_id ?? alarmFromBody?.id
  
  const db = supabaseAdmin()
  const alarm =
    alarmFromBody
      ? alarmFromBody
      : (await db
        .from('alarms')
        .select('*')
        .eq('id', alarmId)
        .single()).data
  
  if (!alarm) return NextResponse.json({ error: 'Alarm not found' }, { status: 404 })

  // Signal Hunter Flask API'yi tetikle
  const response = await fetch('http://localhost:5001/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alarm_id: alarm.id,
      config_yaml: alarm.config_yaml,
      intent: alarm.intent,
      alarm_name: alarm.name,
    })
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Signal Hunter failed' }, { status: 500 })
  }

  const result = await response.json()
  return NextResponse.json(result)
}