/**
 * Hook for managing splash screen preferences
 * Tracks whether user has seen the full splash screen animation
 * Uses localStorage for persistent cross-session tracking
 *
 * IMPORTANT: localStorage can throw (e.g. iOS private mode), so we guard all access.
 */

const SPLASH_SEEN_KEY = "ayoka_splash_seen";

export const useSplashPreference = () => {
  let hasSeenFullSplash = false;
  try {
    hasSeenFullSplash = localStorage.getItem(SPLASH_SEEN_KEY) === "true";
  } catch (e) {
    // Storage unavailable; treat as first-time user
    hasSeenFullSplash = false;
  }

  const markFullSplashSeen = () => {
    try {
      localStorage.setItem(SPLASH_SEEN_KEY, "true");
    } catch (e) {
      // Ignore storage failures
    }
  };

  return {
    isReturningUser: hasSeenFullSplash,
    markFullSplashSeen,
  };
};

