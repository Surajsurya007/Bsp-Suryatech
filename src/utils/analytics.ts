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
const GTM_CONTAINER_ID = import.meta.env.VITE_GTM_CONTAINER_ID || 'GTM-P7835332';
const IS_PROD = import.meta.env.PROD;

/**
 * Initializes Google Tag Manager (GTM).
 * Runs only in production, as early as possible, to enable robust tracking.
 */
export const initGTM = (): void => {
  if (!IS_PROD) {
    console.log('[GTM Dev Mode] Skipping initialization');
    return;
  }

  if (typeof window === 'undefined') return;

  // Prevent double initialization
  if ((window as any)._gtm_initialized) return;

  try {
    // Setup dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Inject GTM script dynamically using an async script tag for highest performance
    const firstScript = document.getElementsByTagName('script')[0];
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;

    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    (window as any)._gtm_initialized = true;
    console.log(`[GTM] Initialized with Container ID: ${GTM_CONTAINER_ID}`);
  } catch (error) {
    console.error('[GTM] Failed to initialize Google Tag Manager:', error);
  }
};

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
    console.log(`[Analytics Dev Mode] Page View: ${path}`);
    return;
  }

  if (typeof window !== 'undefined') {
    // 1. Log to GA4 via gtag
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: document.title,
        page_location: window.location.href,
      });
    }

    // 2. Log to GTM by pushing a structured virtual_pageview event object
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'virtual_pageview',
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

/**
 * Logs a custom event in GA4 and GTM.
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
    console.log(`[Analytics Dev Mode] Custom Event: [${action}]`, { category, label, value });
    return;
  }

  if (typeof window !== 'undefined') {
    // 1. Log to GA4 via gtag
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }

    // 2. Log to GTM by pushing a structured custom event object
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: action,
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Logs a highly detailed GA4/GTM event with custom key-value parameters.
 * @param eventName The event name (e.g., 'whatsapp_click', 'software_download')
 * @param params Object containing key-value pairs (e.g., software_name, button_text, destination_url)
 */
export const logGA4Event = (eventName: string, params: Record<string, any>): void => {
  const enrichedParams = {
    ...params,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  };

  if (!IS_PROD) {
    console.log(`[Analytics Dev Mode] GA4/GTM Event: [${eventName}]`, enrichedParams);
    return;
  }

  if (typeof window !== 'undefined') {
    // 1. Log to GA4 via gtag
    if (window.gtag) {
      window.gtag('event', eventName, enrichedParams);
    }

    // 2. Log to GTM by pushing structured custom event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...enrichedParams
    });
  }
};

