/**
 * Google Analytics 4 (GA4) Analytics Utility
 * Scalable, production-only, non-blocking, and highly optimized.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Measurement ID can be configured via environment variables, with a fallback to the user's specific GA4 ID
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-4VVMRDJ9C6';
const IS_PROD = import.meta.env.PROD;

/**
 * Initializes Google Analytics 4.
 * Only runs in production environment to avoid polluting analytics with dev traffic.
 */
export const initGA = (): void => {
  if (!IS_PROD) {
    console.log('[GA4 Dev Mode] Skipping initialization');
    return;
  }

  if (typeof window === 'undefined') return;

  // Prevent double initialization
  if (window.gtag) return;

  try {
    // Inject Google Tag script dynamically to ensure it is non-blocking and doesn't affect page speed
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());

    // Configure GA4 to not auto-send page_views so we can track single-page-app route changes manually with absolute precision
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
    });

    console.log(`[GA4] Initialized with Measurement ID: ${MEASUREMENT_ID}`);
  } catch (error) {
    console.error('[GA4] Failed to initialize:', error);
  }
};

/**
 * Logs a standard page view event in GA4.
 * @param path The relative URL path (e.g. '/pricing', '/software/retail_billing')
 */
export const logPageView = (path: string): void => {
  if (!IS_PROD) {
    console.log(`[GA4 Dev Mode] Page View: ${path}`);
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

/**
 * Logs a custom event in GA4.
 * @param action The event action name (e.g., 'contact_click', 'download_click')
 * @param category The event category (e.g., 'engagement', 'conversion')
 * @param label Optional text label for additional detail (e.g., 'WhatsApp Quote Button')
 * @param value Optional numeric value associated with the event
 */
export const logEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!IS_PROD) {
    console.log(`[GA4 Dev Mode] Custom Event: [${action}]`, { category, label, value });
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
