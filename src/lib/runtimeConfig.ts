/**
 * Runtime config helpers (browser-safe)
 *
 * Problem this solves:
 * - When the app is accessed via IP/domain, calling `http://localhost:3001`
 *   from the browser is blocked (Private Network Access / loopback).
 * - Default to calling the backend on the same hostname at port 3001 instead.
 */

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
  if (fromEnv.trim()) return trimTrailingSlash(fromEnv.trim());

  // Browser-only fallback
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // Local development defaults
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return "http://localhost:3001";
    }

    // When accessed via IP/domain, hit backend on same host (port 3001)
    return `${protocol}//${hostname}:3001`;
  }

  // Non-browser fallback
  return "http://localhost:3001";
}

