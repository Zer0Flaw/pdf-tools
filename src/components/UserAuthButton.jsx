import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { useSubscription } from '../utils/subscription'

const CLERK_AVAILABLE = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function UserAuthButtonInner() {
  const { isPremium } = useSubscription()

  return (
    <div className="user-auth-button">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="auth-sign-in-btn">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="user-auth-signed-in">
          {isPremium && <span className="pro-badge">Pro</span>}
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: '32px', height: '32px' },
              },
            }}
          />
        </div>
      </SignedIn>
    </div>
  )
}

export default function UserAuthButton() {
  if (!CLERK_AVAILABLE) return null

  return <UserAuthButtonInner />
}
