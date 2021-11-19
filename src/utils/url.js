/**
 * @param string
 */
export function isValidUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * @param url
 */
export function getHost(url) {
  return new URL(url).host;
}
