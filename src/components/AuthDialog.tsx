import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ApiError, auth } from '../lib/api'
import { lockPageScroll } from '../lib/smoothScroll'

type Mode = 'phone' | 'email-in' | 'email-up'

const digits = (s: string) => s.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')

/** Sign in / create account. Phone code is the primary path; email + password covers numbers SMS cannot reach yet. */
export function AuthDialog({ onClose, onDone, reason }: { onClose: () => void; onDone: () => void; reason?: string }) {
  const titleId = useId()
  const first = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>('phone')
  const [step, setStep] = useState<'enter' | 'code'>('enter')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { lockPageScroll(true); return () => lockPageScroll(false) }, [])
  useEffect(() => { first.current?.focus() }, [mode, step])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try { await fn() } catch (e) {
      if (e instanceof ApiError && e.code === 'OTP_UNAVAILABLE') {
        setError('Text-message codes are not available for this number yet. Please use email instead.')
        setMode('email-in')
        setStep('enter')
      } else setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    } finally { setBusy(false) }
  }

  const sendCode = () => run(async () => {
    const p = digits(phone)
    if (!/^[6-9]\d{9}$/.test(p)) throw new ApiError(400, 'VALIDATION_FAILED', 'Enter a 10-digit Indian mobile number')
    await auth.requestOtp(`+91${p}`)
    setStep('code')
  })
  const verify = () => run(async () => {
    if (!/^\d{6}$/.test(code)) throw new ApiError(400, 'VALIDATION_FAILED', 'Enter the 6-digit code')
    await auth.verifyOtp(`+91${digits(phone)}`, code)
    onDone()
  })
  const emailGo = () => run(async () => {
    if (mode === 'email-up') {
      if (name.trim().length < 2) throw new ApiError(400, 'VALIDATION_FAILED', 'Please enter your name')
      if (password.length < 10) throw new ApiError(400, 'VALIDATION_FAILED', 'Use a password of at least 10 characters')
      await auth.register(email.trim(), password, name.trim())
    } else await auth.login(email.trim(), password)
    onDone()
  })

  return (
    <motion.div className="drawer-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
      <button className="drawer-scrim" type="button" onClick={onClose} aria-label="Close sign in" tabIndex={-1} />
      <motion.div className="auth-card" role="dialog" aria-modal="true" aria-labelledby={titleId}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: .3 }}>
        <header>
          <p className="kicker">Your account</p>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <h2 id={titleId}>{mode === 'email-up' ? 'Create account' : 'Sign in'}</h2>
        {reason && <p className="auth-note">{reason}</p>}

        {mode === 'phone' && step === 'enter' && (
          <form onSubmit={(e) => { e.preventDefault(); void sendCode() }}>
            <label className="field"><span>Mobile number</span>
              <div className="field-row"><i>+91</i>
                <input ref={first} inputMode="numeric" autoComplete="tel-national" maxLength={14} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98000 00000" />
              </div>
            </label>
            <button className="solid-button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
          </form>
        )}
        {mode === 'phone' && step === 'code' && (
          <form onSubmit={(e) => { e.preventDefault(); void verify() }}>
            <p className="auth-note">We sent a 6-digit code to +91 {digits(phone)}.</p>
            <label className="field"><span>Code</span>
              <input ref={first} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
            </label>
            <button className="solid-button" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Verify & continue'}</button>
            <button className="link-button" type="button" onClick={() => { setStep('enter'); setCode('') }}>Use a different number</button>
          </form>
        )}
        {mode !== 'phone' && (
          <form onSubmit={(e) => { e.preventDefault(); void emailGo() }}>
            {mode === 'email-up' && (
              <label className="field"><span>Full name</span><input ref={first} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
            )}
            <label className="field"><span>Email</span><input ref={mode === 'email-in' ? first : undefined} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="field"><span>Password</span><input type="password" autoComplete={mode === 'email-up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button className="solid-button" type="submit" disabled={busy}>{busy ? 'One moment…' : mode === 'email-up' ? 'Create account' : 'Sign in'}</button>
          </form>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <a className="link-button" href="/password-reset">Forgot password or verify email</a>

        <div className="auth-switch">
          {mode === 'phone' ? (
            <button className="link-button" type="button" onClick={() => { setMode('email-in'); setError(null) }}>Use email instead</button>
          ) : (
            <>
              <button className="link-button" type="button" onClick={() => { setMode('phone'); setStep('enter'); setError(null) }}>Use mobile number</button>
              <button className="link-button" type="button" onClick={() => { setMode(mode === 'email-in' ? 'email-up' : 'email-in'); setError(null) }}>
                {mode === 'email-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
