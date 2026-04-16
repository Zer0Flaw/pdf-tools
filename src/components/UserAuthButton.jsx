import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { useSubscription } from '../utils/subscription'

const CLERK_AVAILABLE = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function UserAuthButtonInner() {
  const { isPremium } = useSubscription()
  const { user } = useUser()

  async function openPortal() {
    try {
      const workerUrl = import.meta.env.VITE_SUBSCRIPTION_WORKER_URL;
      if (!workerUrl) return;

      const response = await fetch(`${workerUrl}/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress }),
      });

      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank", "noopener");
      }
    } catch (err) {
      console.error("Failed to open subscription portal:", err);
    }
  }

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
          {isPremium && (
            <button type="button" className="manage-subscription-btn" onClick={openPortal}>
              Manage Subscription
            </button>
          )}
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
