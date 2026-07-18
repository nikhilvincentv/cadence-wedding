import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import App from './App.jsx'
import LoginScreen from './LoginScreen.jsx'
import './styles.css'

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_bG9naWNhbC10cmVlZnJvZy03OS5jbGVyay5hY2NvdW50cy5kZXYk'

const clerkAppearance = {
  variables: {
    colorBackground: '#14141b',
    colorText: '#f3efe9',
    colorTextSecondary: '#a9a3b0',
    colorPrimary: '#c67a68',
    colorInputBackground: '#1b1b24',
    colorInputText: '#f3efe9',
    colorNeutral: '#f3efe9',
    borderRadius: '12px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance} afterSignOutUrl="/">
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
    </ClerkProvider>
  </React.StrictMode>
)
