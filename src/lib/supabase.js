import { createClient } from "@supabase/supabase-js";

// Values come from .env.local (local) or Netlify → Environment variables.
// Tidy up common copy-paste mistakes (quotes, spaces, "NAME=value", missing
// https://, a trailing /rest/v1/) so a small typo never blanks the site.
const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^VITE_SUPABASE_[A-Z_]+\s*=\s*/, "")
    .replace(/^['"`]+|['"`]+$/g, "")
    .trim();

const normaliseUrl = (value) => {
  if (!value) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    return url.hostname.includes(".") ? url.origin : "";
  } catch {
    return "";
  }
};

const keyRole = (key) => {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "anon";
  try {
    const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="))).role;
  } catch {
    return null;
  }
};

const rawUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const rawKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);
const supabaseUrl = normaliseUrl(rawUrl);

let client = null;
let configError = "";

if (rawUrl || rawKey) {
  if (!rawUrl) {
    configError = "VITE_SUPABASE_URL is missing.";
  } else if (!supabaseUrl) {
    configError = `VITE_SUPABASE_URL isn’t a valid address (it is set to “${rawUrl.slice(0, 60)}”). It should look like https://abcdefgh.supabase.co`;
  } else if (!rawKey) {
    configError = "VITE_SUPABASE_ANON_KEY is missing.";
  } else if (/^https?:\/\//i.test(rawKey)) {
    configError = "VITE_SUPABASE_ANON_KEY contains a web address — the URL and key look swapped.";
  } else if (["service_role", "secret"].includes(keyRole(rawKey))) {
    configError =
      "VITE_SUPABASE_ANON_KEY is a secret (service_role) key. Never put that in a website — use the anon / publishable key instead.";
  } else {
    try {
      client = createClient(supabaseUrl, rawKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
    } catch (error) {
      configError = error?.message || "Could not connect to Supabase.";
    }
  }
}

if (configError) console.error(`[VLX CMS] Supabase setup problem: ${configError}`);

// When Supabase isn't set up (or is set up wrongly) the site still works:
// the homepage falls back to the built-in rentals list and /admin explains
// what needs fixing.
export const supabase = client;
export const isSupabaseConfigured = Boolean(client);
export const supabaseConfigError = configError;
