import { createContext, useContext, useEffect, useState } from "react";

const WORKER_URL = import.meta.env.VITE_SUBSCRIPTION_WORKER_URL || "";
const SubscriptionContext = createContext({ isPremium: false, status: "none", loading: false });

export function SubscriptionProvider({ email, children }) {
  const [state, setState] = useState({ isPremium: false, status: "none", loading: false });

  useEffect(() => {
    if (!email || !WORKER_URL) {
      setState({ isPremium: false, status: "none", loading: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    fetch(`${WORKER_URL}/status?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setState({
            isPremium: data.isPremium === true,
            status: data.status || "none",
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ isPremium: false, status: "error", loading: false });
        }
      });

    return () => { cancelled = true; };
  }, [email]);

  return (
    <SubscriptionContext.Provider value={state}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
