// utils.js

/**
 * Parse a date string (e.g., "1945" or "1945-05-09") and return a Date object.
 * If it fails, returns null.
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    // Attempt to parse just the year
    if (dateStr.length === 4 && /^\d{4}$/.test(dateStr)) {
        return new Date(+dateStr, 0, 1);
    }
    // Otherwise let native Date parsing do the job
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Convert a date object to just the year (integer).
 */
function getYear(date) {
    if (!date) return null;
    return date.getFullYear();
}

/**
 * Normalize a location string if needed. Just a placeholder.
 */
function normalizeLocation(locationStr) {
    if (!locationStr) return null;
    return locationStr.trim();
}