import React, { useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

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

  function appBase() {
    const b = window.location.href.split('#')[0].split('?')[0]
    return b.endsWith('/') ? b : b + '/'
  }

  async function google() {
    if (!ready) return
    setError('')
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: appBase() + 'sso-callback',
        redirectUrlComplete: appBase(),
      })
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Google sign-in is not available. Enable it in your Clerk dashboard.')
    }
  }

  async function doSignIn(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await signIn.create({ identifier: email, password })
      if (res.status === 'complete') await setActiveSignIn({ session: res.createdSessionId })
      else setError('Could not complete sign in.')
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
      if (res.status === 'complete') await setActiveSignUp({ session: res.createdSessionId })
      else setError('Verification incomplete. Try again.')
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Invalid code.')
    } finally {
      setBusy(false)
    }
  }

  const googleBtn = (
    <>
      <button type="button" className="auth-google" onClick={google} disabled={!ready}>
        <GoogleMark /> Continue with Google
      </button>
      <div className="auth-or"><span>or</span></div>
    </>
  )

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
            <input className="auth-input" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-btn" type="submit" disabled={busy || !ready}>{busy ? 'Verifying...' : 'Verify & continue'}</button>
            <button type="button" className="auth-link-btn" onClick={() => { setMode('signup'); setError('') }}>Use a different email</button>
          </form>
        ) : mode === 'signup' ? (
          <form onSubmit={doSignUp}>
            <h2 className="auth-title">Create your account</h2>
            <p className="auth-desc">Start your wedding command center.</p>
            {googleBtn}
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            {error && <div className="auth-error">{error}</div>}
            <div id="clerk-captcha" />
            <button className="auth-btn" type="submit" disabled={busy || !ready}>{busy ? 'Creating...' : 'Create account'}</button>
            <div className="auth-switch">Already have an account? <button type="button" className="auth-link" onClick={() => { setMode('signin'); setError('') }}>Sign in</button></div>
          </form>
        ) : (
          <form onSubmit={doSignIn}>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-desc">Sign in to your command center.</p>
            {googleBtn}
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-btn" type="submit" disabled={busy || !ready}>{busy ? 'Signing in...' : 'Sign in'}</button>
            <div className="auth-switch">New here? <button type="button" className="auth-link" onClick={() => { setMode('signup'); setError('') }}>Create an account</button></div>
          </form>
        )}
      </div>
    </div>
  )
}
