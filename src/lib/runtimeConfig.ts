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

    // Check if it's a Vercel domain (vercel.app) or production domain
    // In production, we should use VITE_API_BASE_URL environment variable
    // If not set, use relative path which will work with vercel.json rewrites
    // (assuming backend is deployed separately and configured in rewrites)
    if (hostname.includes("vercel.app") || hostname.includes("vercel.com")) {
      // Use empty string to make API calls relative (e.g., /api/auth/login)
      // This requires VITE_API_BASE_URL to be set to the backend URL
      // OR vercel.json rewrites to proxy to backend
      // For now, return empty to use relative paths
      return "";
    }

    // When accessed via IP/domain (not Vercel), hit backend on same host (port 3001)
    return `${protocol}//${hostname}:3001`;
  }

  // Non-browser fallback
  return "http://localhost:3001";
}

