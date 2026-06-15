import { createClient } from "@supabase/supabase-js";

// =========================================================================
//              DYNAMIC SUPABASE CLIENT RESOLVER (WITH CACHING)
// =========================================================================

// Load initially cached credentials if available to support instantaneous startup
const cachedUrl = localStorage.getItem("bsp_supabase_url");
const cachedKey = localStorage.getItem("bsp_supabase_anon_key");

const DEFAULT_URL = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "https://wabhgsdzmptgxrggjjgm.supabase.co";
const DEFAULT_KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "sb_publishable_gI4ZjOm-5A5_DVQylKcuWA_QLcDyT0d";

let activeClient = createClient(
  cachedUrl || DEFAULT_URL,
  cachedKey || DEFAULT_KEY
);

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

