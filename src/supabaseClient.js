import { createClient } from "@supabase/supabase-js";

// =========================================================================
//              DYNAMIC SUPABASE CLIENT RESOLVER (WITH CACHING & PROXY)
// =========================================================================

// Load initially cached credentials if available to support instantaneous startup
const cachedUrl = localStorage.getItem("bsp_supabase_url");
const cachedKey = localStorage.getItem("bsp_supabase_anon_key");

const DEFAULT_URL = "https://wabhgsdzmptgxrggjjgm.supabase.co";
const DEFAULT_KEY = "sb_publishable_gI4ZjOm-5A5_DVQylKcuWA_QLcDyT0d";

let activeClient = createClient(
  cachedUrl || DEFAULT_URL,
  cachedKey || DEFAULT_KEY
);

// Fetch dynamic active credentials from the backend database settings
fetch('/api/auth/supabase-public-config')
  .then(res => {
    if (res.ok) return res.json();
    throw new Error('Supabase client config fetch failed');
  })
  .then(config => {
    if (config && config.url && config.anonKey) {
      const newUrl = config.url.trim();
      const newKey = config.anonKey.trim();

      // If configuration has changed, recreate the client and write to LocalStorage
      if (newUrl !== cachedUrl || newKey !== cachedKey) {
        console.log("Supabase Client: Dynamically switching instance to custom configured project URL:", newUrl);
        localStorage.setItem("bsp_supabase_url", newUrl);
        localStorage.setItem("bsp_supabase_anon_key", newKey);
        activeClient = createClient(newUrl, newKey);
      }
    }
  })
  .catch(err => {
    console.warn("Supabase Client: Dynamic config loading deferred, using cache/fallback.", err);
  });

// Export a robust Proxy that transparently forwards all operations and correctly binds methods to the active client
/**
 * @type {any}
 */
export const supabase = new Proxy({}, {
  get(target, prop, receiver) {
    const val = Reflect.get(activeClient, prop);
    if (typeof val === 'function') {
      return val.bind(activeClient);
    }
    return val;
  },
  set(target, prop, value, receiver) {
    return Reflect.set(activeClient, prop, value, receiver);
  }
});

