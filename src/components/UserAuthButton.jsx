import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

const CLERK_AVAILABLE = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

export default function UserAuthButton() {
  if (!CLERK_AVAILABLE) return null

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
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: '32px', height: '32px' },
            },
          }}
        />
      </SignedIn>
    </div>
  )
}
