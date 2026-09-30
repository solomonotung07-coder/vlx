// CMS sign-in lasts a fixed 30 minutes from the moment the admin signs in.
// After that the admin is signed out and must enter their password again.
// The same limit is enforced by the database (supabase/003_session_limit.sql),
// so an old login can't be reused to change products.

export const SESSION_LIMIT_MINUTES = 30;
export const SESSION_LIMIT_MS = SESSION_LIMIT_MINUTES * 60 * 1000;

const decodeJwtPayload = (token) => {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

/**
 * When the admin actually typed their password (ms since epoch).
 * Uses the token's `amr` sign-in timestamp, which stays the same when
 * Supabase silently refreshes the token, so refreshing never extends the limit.
 */
export const getSignInTime = (session) => {
  if (!session) return null;
  const amr = decodeJwtPayload(session.access_token)?.amr;
  if (Array.isArray(amr)) {
    const latest = Math.max(0, ...amr.map((entry) => Number(entry?.timestamp) || 0));
    if (latest > 0) return latest * 1000;
  }
  const lastSignIn = Date.parse(session.user?.last_sign_in_at ?? "");
  return Number.isFinite(lastSignIn) ? lastSignIn : null;
};

/** Expiry time in ms, or 0 if the sign-in time is unknown (treated as expired). */
export const getSessionExpiry = (session) => {
  const signedInAt = getSignInTime(session);
  return signedInAt ? signedInAt + SESSION_LIMIT_MS : 0;
};

export const isSessionExpired = (session, now = Date.now()) =>
  now >= getSessionExpiry(session);
