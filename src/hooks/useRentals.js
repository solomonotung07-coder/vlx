import { useEffect, useState } from "react";
import defaultRentals from "../data/defaultRentals";
import { fetchPublishedRentals, toPublicRental } from "../lib/rentals";
import { isSupabaseConfigured } from "../lib/supabase";

/**
 * Featured Rentals for the homepage.
 * - Supabase configured → live products managed in /admin
 * - Not configured      → the built-in list in src/data/defaultRentals.js
 */
export default function useRentals() {
  const [state, setState] = useState(() => ({
    rentals: isSupabaseConfigured ? [] : defaultRentals,
    loading: isSupabaseConfigured,
    error: null,
  }));

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cancelled = false;

    fetchPublishedRentals()
      .then((rows) => {
        if (!cancelled) {
          setState({ rentals: rows.map(toPublicRental), loading: false, error: null });
        }
      })
      .catch((error) => {
        console.error("Failed to load rentals:", error);
        if (!cancelled) setState({ rentals: [], loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
