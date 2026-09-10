import { useEffect, useState } from "react";

/**
 * Same API as useState, but persisted to localStorage under `key`.
 * Falls back to `initialValue` if nothing is stored yet or storage
 * is unavailable (e.g. private browsing).
 */
export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write failures (storage disabled/full).
    }
  }, [key, value]);

  return [value, setValue];
}
