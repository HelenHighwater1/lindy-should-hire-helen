/**
 * Fixed IANA timezone for UI date formatting. Server and browser must use the
 * same zone or Next.js SSR and hydration produce different text (React #418).
 */
export const DISPLAY_TIME_ZONE = "America/Los_Angeles";
