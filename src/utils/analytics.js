/**
 * analytics.js — Phase 5
 * ====================================
 * Posthog analytics wrapper.
 * Import this in main.jsx and call track() anywhere in the app.
 *
 * SETUP:
 *   1. npm install posthog-js
 *   2. Go to posthog.com → create free account → create project
 *   3. Copy your Project API Key (looks like phc_xxxx)
 *   4. Replace YOUR_POSTHOG_KEY below
 *   5. Import init() in main.jsx and call it once
 *
 * USAGE:
 *   import { track } from "./utils/analytics";
 *   track("generation_completed", { subject: "Direct Tax", attempt: "Final" });
 *
 * KEY EVENTS TO TRACK (already used in App.jsx):
 *   - generation_completed  → tells you most popular subjects
 *   - paywall_shown         → tells you conversion funnel entry
 *   - payment_initiated     → tells you click-through rate
 *   - premium_activated     → tells you conversion rate
 *   - tab_viewed            → tells you which features users love
 */

// Replace with your actual Posthog key from posthog.com
const POSTHOG_KEY = "YOUR_POSTHOG_KEY_HERE";

let posthog = null;

/**
 * Initialize Posthog analytics.
 * Call this once in main.jsx before rendering.
 *
 * Example:
 *   import { initAnalytics } from "./utils/analytics";
 *   initAnalytics();
 */
export async function initAnalytics() {
  if (POSTHOG_KEY === "phc_zQcshGV7m2EpZWLCe5NNbEsxGauigWYvvtTotncvb9A2") {
    console.log("[Analytics] Posthog key not set — tracking disabled");
    return;
  }

  try {
    const ph = await import("posthog-js");
    posthog = ph.default;
    posthog.init(POSTHOG_KEY, {
      api_host:    "https://app.posthog.com",
      autocapture: false,      // manual tracking only — cleaner data
      capture_pageview: false, // we track manually
      persistence: "localStorage",
    });
    console.log("[Analytics] Posthog initialized");
  } catch (e) {
    console.warn("[Analytics] Posthog failed to load:", e.message);
  }
}

/**
 * Track an event.
 * Silently fails if Posthog isn't loaded.
 *
 * @param {string} event - Event name (e.g. "generation_completed")
 * @param {object} props - Optional properties (e.g. { subject, attempt })
 */
export function track(event, props = {}) {
  try {
    if (posthog) {
      posthog.capture(event, props);
    }
  } catch {}
}

/**
 * Identify a user by email.
 * Call this after the user enters their email.
 * Lets you see individual user journeys in Posthog.
 */
export function identify(email) {
  try {
    if (posthog && email) {
      posthog.identify(email);
    }
  } catch {}
}

/**
 * All event names used in the app.
 * Use these constants instead of raw strings to avoid typos.
 */
export const EVENTS = {
  // User journey
  EMAIL_SUBMITTED:       "email_submitted",
  SUBJECT_SELECTED:      "subject_selected",

  // Core feature
  GENERATION_STARTED:    "generation_started",
  GENERATION_COMPLETED:  "generation_completed",
  GENERATION_FAILED:     "generation_failed",

  // Tabs
  TAB_VIEWED:            "tab_viewed",
  PDF_UPLOADED:          "pdf_uploaded",
  PDF_EXPORTED:          "pdf_exported",

  // Monetization funnel
  PAYWALL_SHOWN:         "paywall_shown",
  PAYMENT_INITIATED:     "payment_initiated",
  PREMIUM_ACTIVATED:     "premium_activated",

  // Referrals
  REFERRAL_LINK_COPIED:  "referral_link_copied",
  REFERRAL_USED:         "referral_used",
};