import type { NextConfig } from "next";

/**
 * Next.js 16 enables `src/instrumentation.ts` by default. The older
 * `experimental.instrumentationHook` flag is invalid and triggers
 * invalid-config warnings, so it is omitted here.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
