import React from 'react'
import { SignIn } from '@clerk/clerk-react'

export default function LoginScreen() {
  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="login-mark">C</div>
        <div className="login-name">Cadence</div>
        <div className="login-sub">Wedding OS</div>
        <p className="login-tag">
          Zola helps you plan.<br />
          <span>Cadence makes sure it actually happens.</span>
        </p>
      </div>
      <div className="login-card">
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: { boxShadow: 'none', background: 'transparent' },
            },
          }}
        />
      </div>
    </div>
  )
}
