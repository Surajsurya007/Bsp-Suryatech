/**
 * IndexNow Service for bspsuryatech.in
 * 
 * Provides robust, production-ready URL submission to the IndexNow protocol.
 * Integrates with the official api.indexnow.org coordinator to notify search engines (Bing, Yandex, etc.) of content changes.
 * Incorporates a sliding deduplication window to safeguard against duplicate/spam API calls.
 */

// Retrieve IndexNow Key from process.env or fallback to the generated key
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '85fe69ab1264c892b1a03fef4509cc3a';
const lastSubmittedUrls = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000; // 5-minute sliding window

/**
 * Returns the currently active IndexNow verification key.
 */
export function getActiveIndexNowKey(): string {
  return INDEXNOW_KEY;
}

/**
 * Perform actual asynchronous HTTP POST submission to the official IndexNow API endpoint.
 * Ensures URLs are properly structured, validated, and restricted to the production host.
 */
export async function submitToIndexNow(urls: string[]): Promise<boolean> {
  if (!urls || urls.length === 0) {
    return false;
  }

  // Filter and sanitize URLs to ensure they only target the official production host and protocols
  const validUrls = urls.filter(url => {
    try {
      const parsed = new URL(url);
      return (
        (parsed.hostname === 'bspsuryatech.in' || parsed.hostname === 'www.bspsuryatech.in') &&
        (parsed.protocol === 'http:' || parsed.protocol === 'https:')
      );
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    console.log('[IndexNow] No valid production URLs on bspsuryatech.in provided.');
    return false;
  }

  const payload = {
    host: 'bspsuryatech.in',
    key: INDEXNOW_KEY,
    keyLocation: `https://bspsuryatech.in/${INDEXNOW_KEY}.txt`,
    urlList: validUrls
  };

  console.log(`[IndexNow] Dispatched payload for ${validUrls.length} URL(s) to IndexNow API...`);

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[IndexNow] API submission succeeded (Status: ${response.status}). URLs notified.`);
      return true;
    } else {
      const text = await response.text();
      console.warn(`[IndexNow] API submission failed (Status: ${response.status}). Response: ${text}`);
      return false;
    }
  } catch (error) {
    console.error('[IndexNow] Request exception:', error);
    return false;
  }
}

/**
 * Queue a single URL for IndexNow submission with sliding deduplication check.
 */
export function queueIndexNowSubmission(url: string): void {
  const now = Date.now();
  const lastTime = lastSubmittedUrls.get(url);

  if (lastTime && (now - lastTime < DEDUPLICATION_WINDOW_MS)) {
    console.log(`[IndexNow] URL "${url}" was submitted in the last 5 minutes. Skipping duplicate to prevent rate-limiting.`);
    return;
  }

  lastSubmittedUrls.set(url, now);

  // Non-blocking background dispatch
  submitToIndexNow([url]).catch(err => {
    console.error(`[IndexNow] Background dispatch failed for ${url}:`, err);
  });
}

/**
 * Queue multiple URLs for IndexNow submission with sliding deduplication check.
 */
export function queueIndexNowSubmissions(urls: string[]): void {
  const now = Date.now();
  const uniqueUrls: string[] = [];

  for (const url of urls) {
    const lastTime = lastSubmittedUrls.get(url);
    if (!lastTime || (now - lastTime >= DEDUPLICATION_WINDOW_MS)) {
      lastSubmittedUrls.set(url, now);
      uniqueUrls.push(url);
    } else {
      console.log(`[IndexNow] URL "${url}" was submitted in the last 5 minutes. Skipping duplicate.`);
    }
  }

  if (uniqueUrls.length > 0) {
    // Non-blocking background dispatch
    submitToIndexNow(uniqueUrls).catch(err => {
      console.error('[IndexNow] Background batch dispatch failed:', err);
    });
  }
}
