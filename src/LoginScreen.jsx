import React, { useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'

export default function LoginScreen() {
  const { isLoaded: siLoaded, signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded: suLoaded, signUp, setActive: setActiveSignUp } = useSignUp()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const ready = siLoaded && suLoaded

  async function doSignIn(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await signIn.create({ identifier: email, password })
      if (res.status === 'complete') {
        await setActiveSignIn({ session: res.createdSessionId })
      } else {
        setError('Could not complete sign in.')
      }
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Sign in failed. Check your email and password.')
    } finally {
      setBusy(false)
    }
  }

  async function doSignUp(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setMode('verify')
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Could not create account.')
    } finally {
      setBusy(false)
    }
  }

  async function doVerify(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await signUp.attemptEmailAddressVerification({ code })
      if (res.status === 'complete') {
        await setActiveSignUp({ session: res.createdSessionId })
      } else {
        setError('Verification incomplete. Try again.')
      }
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Invalid code.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="login-mark">C</div>
        <div className="login-name">Cadence</div>
        <div className="login-sub">Wedding OS</div>
        <p className="login-tag">
          Plan less. Panic never.<br />
          <span>The AI command center for your wedding.</span>
        </p>
      </div>

      <div className="auth-card">
        {mode === 'verify' ? (
          <form onSubmit={doVerify}>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-desc">We sent a 6-digit code to {email}.</p>
            <label className="auth-label">Verification code</label>
            <input
              className="auth-input"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-btn" type="submit" disabled={busy || !ready}>
              {busy ? 'Verifying...' : 'Verify & continue'}
            </button>
            <button type="button" className="auth-link-btn" onClick={() => { setMode('signup'); setError('') }}>
              Use a different email
            </button>
          </form>
        ) : mode === 'signup' ? (
          <form onSubmit={doSignUp}>
            <h2 className="auth-title">Create your account</h2>
            <p className="auth-desc">Start your wedding command center.</p>
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && <div className="auth-error">{error}</div>}
            <div id="clerk-captcha" />
            <button className="auth-btn" type="submit" disabled={busy || !ready}>
              {busy ? 'Creating...' : 'Create account'}
            </button>
            <div className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="auth-link" onClick={() => { setMode('signin'); setError('') }}>
                Sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={doSignIn}>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-desc">Sign in to your command center.</p>
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-btn" type="submit" disabled={busy || !ready}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="auth-switch">
              New here?{' '}
              <button type="button" className="auth-link" onClick={() => { setMode('signup'); setError('') }}>
                Create an account
              </button>
            </div>
          </form>
        )}
        <div className="auth-powered">Powered by Clerk</div>
      </div>
    </div>
  )
}
