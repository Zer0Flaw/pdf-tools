import { useEffect } from "react";

export default function ScrollToTop({ pathname }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
