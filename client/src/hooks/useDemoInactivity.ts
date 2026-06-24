/**
 * useDemoInactivity
 *
 * When the current user is in demo mode, this hook starts a 30-minute inactivity
 * timer. Any user interaction (mouse move, click, keypress, scroll, touch) resets
 * the timer. When the timer fires, the demo session cookie is cleared server-side
 * and the user is redirected to /demo-ended.
 *
 * Usage: call once at the app root level when isDemo is true.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export function useDemoInactivity(isDemo: boolean) {
  const [, navigate] = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDemo) return;

    const expire = () => {
      // Clear the session cookie by hitting the logout endpoint, then redirect
      fetch("/api/trpc/localAuth.logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: null }),
      })
        .catch(() => {/* ignore — redirect anyway */})
        .finally(() => {
          navigate("/demo-ended");
        });
    };

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(expire, INACTIVITY_MS);
    };

    // Start the timer immediately
    reset();

    // Reset on any user activity
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [isDemo, navigate]);
}
