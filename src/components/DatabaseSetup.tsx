'use client'
import { useState, useEffect } from 'react'
import { Database, Loader2, CheckCircle, AlertCircle, ExternalLink, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'dbSetupDismissed'
const SQL_LINK = `https://supabase.com/dashboard/project/vlhdbvxvehztfilonevj/sql/new`

export default function DatabaseSetup() {
  const [status, setStatus]     = useState<'checking' | 'ok' | 'missing'>('checking')
  const [open, setOpen]         = useState(false)
  const [serviceKey, setServiceKey] = useState('')
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState<{ ok: boolean; message?: string; error?: string } | null>(null)

  useEffect(() => {
    // If user already dismissed, never show again
    if (localStorage.getItem(DISMISSED_KEY)) {
      setStatus('ok')
      return
    }
    fetch('/api/setup-db')
      .then(r => r.json())
      .then(d => {
        if (d.tablesExist) {
          localStorage.setItem(DISMISSED_KEY, 'true')
          setStatus('ok')
        } else {
          setStatus('missing')
        }
      })
      .catch(() => setStatus('ok')) // fail silently — don't block the UI
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setStatus('ok')
    setOpen(false)
  }

  async function runSetup() {
    if (!serviceKey.trim()) return
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/setup-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: serviceKey.trim() }),
      })
      const data = await res.json()
      setResult(data)
      if (data.ok) {
        setStatus('ok')
        localStorage.setItem(DISMISSED_KEY, 'true')
        setTimeout(() => setOpen(false), 1500)
      }
    } catch (e) {
      setResult({ ok: false, error: String(e) })
    } finally {
      setRunning(false)
    }
  }

  if (status !== 'missing') return null

  return (
    <>
      {/* Slim banner — never auto-opens modal */}
      {!open && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Database tables not set up — Pipeline and History won&apos;t save data.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              Setup
            </button>
            <button onClick={dismiss} className="text-amber-500 hover:text-amber-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal — only if user explicitly clicked Setup */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base">One-time Database Setup</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Creates 5 tables in your Supabase project</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-muted rounded-xl text-sm space-y-2">
                <p className="font-semibold">How to get your Personal Access Token:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
                  <li>Go to <strong>supabase.com → Account → Access Tokens</strong></li>
                  <li>Click <strong>Generate new token</strong> and give it any name</li>
                  <li>Copy the token (starts with <code className="bg-background px-1 rounded">sbp_</code>)</li>
                </ol>
                <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1">
                  Open Token Settings <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={serviceKey}
                  onChange={e => setServiceKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runSetup()}
                  placeholder="sbp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2.5 rounded-xl border border-input text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">One-time use. Not stored — only sent to your own Supabase project.</p>
              </div>

              {result && (
                <div className={cn('p-3 rounded-xl text-sm flex items-start gap-2',
                  result.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                )}>
                  {result.ok
                    ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  }
                  <div>
                    <p className="font-semibold">{result.ok ? 'Tables created!' : 'Setup failed'}</p>
                    {result.message && <p className="text-xs mt-0.5">{result.message}</p>}
                    {result.error && <p className="text-xs mt-0.5">{result.error}</p>}
                    {!result.ok && (
                      <p className="text-xs mt-2">
                        Alternative: run the SQL in{' '}
                        <a href={SQL_LINK} target="_blank" rel="noreferrer" className="underline font-semibold">Supabase SQL Editor</a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={dismiss} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Dismiss forever
                </button>
                <button
                  onClick={runSetup}
                  disabled={!serviceKey.trim() || running}
                  className="flex-[2] py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {running
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating tables…</>
                    : <><Database className="w-4 h-4" /> Create Tables</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
