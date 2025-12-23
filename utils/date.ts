import { User } from '../types';

export type DateFormatVariant = 'default' | 'detailed' | 'short';

/**
 * Formats a date string according to the user's timezone preference.
 *
 * @param dateStr - The ISO date string or timestamp
 * @param user - The current user object (containing timezone preference)
 * @param variant - 'default' (numeric), 'detailed' (long month), or 'short' (short month, no time)
 * @param fallback - Optional fallback string if date is missing
 */
export const formatUserDate = (
  dateStr: string | undefined,
  user: User | null | undefined,
  variant: DateFormatVariant = 'default',
  fallback: string = ''
): string => {
  if (!dateStr) return fallback;

  try {
    let dateInput = dateStr;

    // HEURISTIC FIX:
    // Backend often sends UTC times as "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss" without 'Z'.
    // Browsers parse these as Local Time by default.
    // We enforce UTC interpretation by appending 'Z' if missing.
    if (typeof dateStr === 'string') {
      // Case 1: ISO format missing Z (e.g. "2025-12-23T02:02:00")
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(dateStr)) {
        dateInput = dateStr + 'Z';
      }
      // Case 2: SQL format (e.g. "2025-12-23 02:02:00")
      else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(dateStr)) {
        dateInput = dateStr.replace(' ', 'T') + 'Z';
      }
    }

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return dateStr;

    const userTimeZone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const baseOptions: Intl.DateTimeFormatOptions = {
      timeZone: userTimeZone,
      hour12: false
    };

    if (variant === 'detailed') {
      return date.toLocaleString(undefined, {
        ...baseOptions,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    }

    if (variant === 'short') {
      return date.toLocaleString(undefined, {
        ...baseOptions,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZoneName: 'short'
      });
    }

    // Default (Numeric)
    return date.toLocaleString(undefined, {
      ...baseOptions,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (e) {
    console.warn('Date formatting error', e);
    return dateStr;
  }
};
