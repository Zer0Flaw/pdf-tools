import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function Root() {
  useEffect(() => {
    document.dispatchEvent(new Event('prerender-ready'))
  }, [])

  return (
    <StrictMode>
      <App />
    </StrictMode>
  )
}

const rootElement = <Root />

createRoot(document.getElementById('root')).render(
  clerkKey
    ? <ClerkProvider publishableKey={clerkKey}>{rootElement}</ClerkProvider>
    : rootElement
)
