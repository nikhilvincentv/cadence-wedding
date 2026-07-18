import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, SignedIn, SignedOut, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import App from './App.jsx'
import LoginScreen from './LoginScreen.jsx'
import './styles.css'

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_bG9naWNhbC10cmVlZnJvZy03OS5jbGVyay5hY2NvdW50cy5kZXYk'

const clerkAppearance = {
  variables: {
    colorBackground: '#ffffff',
    colorText: '#1a1c1a',
    colorTextSecondary: '#504444',
    colorPrimary: '#7c5454',
    colorInputBackground: '#faf9f6',
    colorInputText: '#1a1c1a',
    colorNeutral: '#1a1c1a',
    borderRadius: '14px',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
}

const isSSOCallback = window.location.pathname.endsWith('/sso-callback')

function Root() {
  const [devBypass, setDevBypass] = React.useState(
    () => localStorage.getItem('cadence_dev_bypass') === '1'
  )

  if (isSSOCallback) return <AuthenticateWithRedirectCallback />

  if (devBypass) return <App />

  return (
    <>
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <LoginScreen
          onSkip={() => {
            localStorage.setItem('cadence_dev_bypass', '1')
            setDevBypass(true)
          }}
        />
      </SignedOut>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance} afterSignOutUrl="/">
      <Root />
    </ClerkProvider>
  </React.StrictMode>
)
