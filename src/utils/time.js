/** @type {number} The number of milliseconds in 1 second */
export const MILLISECONDS_IN_SECOND = 1000;
/** @type {number} The number of seconds in 1 minute */
export const SECONDS_IN_MINUTE = 60;
/** @type {number} The number of minutes in 1 hour */
export const MINUTES_IN_HOUR = 60;
/** @type {number} The number of seconds in 1 hour */
export const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;

/**
 * Get a book's total runtime duration in seconds from it's formatted string
 *
 * @param {string} runtimeStr A string in the format of `N hrs and N mins` to parse
 * @returns {number} The total number of seconds in the book
 */
export function getDurationFromStr(runtimeStr) {
  let duration = 0;

  const hoursMatch = runtimeStr.match(/(\d+) hrs/);
  if (hoursMatch) {
    duration += Number(hoursMatch[1]) * SECONDS_IN_HOUR;
  }

  const minutesMatch = runtimeStr.match(/(\d+) mins/);
  if (minutesMatch) {
    duration += Number(minutesMatch[1]) * SECONDS_IN_MINUTE;
  }

  return duration;
}
