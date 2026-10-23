/**
 * Deprecated path — the real auth page chrome lives at:
 *   client/src/components/auth/AuthLayout.jsx
 *
 * This file previously contained a duplicate AuthProvider that conflicted
 * with context/AuthContext.jsx during Vite HMR.
 */
export { default } from "../components/auth/AuthLayout.jsx";
