import { createClient } from "@supabase/supabase-js";

// =========================================================================
//              DYNAMIC SUPABASE CLIENT RESOLVER (WITH CACHING)
// =========================================================================

// Load initially cached credentials if available to support instantaneous startup
const safeGetItem = (key) => {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch (e) {
    console.warn(`[SUPABASE CLIENT] LocalStorage is read-restricted: ${e.message || e}`);
    return null;
  }
};

const cachedUrl = safeGetItem("bsp_supabase_url");
const cachedKey = safeGetItem("bsp_supabase_anon_key");

const DEFAULT_URL = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "https://wabhgsdzmptgxrggjjgm.supabase.co";
const DEFAULT_KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "sb_publishable_gI4ZjOm-5A5_DVQylKcuWA_QLcDyT0d";

const getValidString = (val) => {
  if (!val || val === "null" || val === "undefined" || typeof val !== "string" || val.trim() === "") {
    return null;
  }
  return val.trim();
};

let activeClient;
try {
  const url = getValidString(cachedUrl) || DEFAULT_URL;
  const key = getValidString(cachedKey) || DEFAULT_KEY;
  activeClient = createClient(url, key);
} catch (e) {
  console.warn("supabaseClient initialization error. Falling back to default URL/Key:", e);
  activeClient = createClient(DEFAULT_URL, DEFAULT_KEY);
}

// =========================================================================
//            ROBUST MOCK FALLBACKS FOR NETWORK & SCHEMA RESILIENCY
// =========================================================================

const createMockQueryBuilder = () => {
  const result = Promise.resolve({ data: [], error: null });
  const handler = {
    get(target, prop) {
      if (prop === 'then') {
        return target.then.bind(target);
      }
      if (typeof prop === 'string') {
        return () => createMockQueryBuilder();
      }
      return undefined;
    }
  };
  return new Proxy(result, handler);
};

const mockAuth = {
  getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  onAuthStateChange: (callback) => {
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      },
      error: null
    };
  },
  signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error("Authentication currently unavailable") }),
  signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error("Registration currently unavailable") }),
  signOut: () => Promise.resolve({ error: null }),
  resetPasswordForEmail: () => Promise.resolve({ error: null }),
  updateUser: () => Promise.resolve({ data: {}, error: null }),
  signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
  exchangeCodeForSession: () => Promise.resolve({ data: { session: null, user: null }, error: new Error("SSO Exchange currently unavailable") })
};

// Export a robust Proxy that transparently forwards all operations, correctly binds methods, 
// and gracefully falls back to mock implementations on failures to prevent runtime crashes.
/**
 * @type {any}
 */
export const supabase = new Proxy({}, {
  get(target, prop, receiver) {
    if (!activeClient) {
      try {
        activeClient = createClient(DEFAULT_URL, DEFAULT_KEY);
      } catch (err) {
        console.warn("Failed to initialize default fallback client in Proxy:", err);
      }
    }

    if (prop === 'auth') {
      if (activeClient && activeClient.auth) {
        return new Proxy(activeClient.auth, {
          get(authTarget, authProp) {
            const val = Reflect.get(authTarget, authProp);
            if (typeof val === 'function') {
              return val.bind(authTarget);
            }
            if (val === undefined) {
              if (authProp in mockAuth) {
                return mockAuth[authProp];
              }
              return () => Promise.resolve({ data: null, error: new Error(`Method ${String(authProp)} is not supported`) });
            }
            return val;
          }
        });
      }
      return mockAuth;
    }

    if (prop === 'from') {
      if (activeClient && typeof activeClient.from === 'function') {
        return function(...args) {
          try {
            const realBuilder = activeClient.from(...args);
            return new Proxy(realBuilder, {
              get(builderTarget, builderProp) {
                if (builderProp === 'then') {
                  return function(onfulfilled, onrejected) {
                    return realBuilder.then(onfulfilled, (err) => {
                      console.warn("[SUPABASE PROXY] Query execution failed:", err);
                      const fallbackVal = { data: [], error: err };
                      return onfulfilled ? onfulfilled(fallbackVal) : fallbackVal;
                    });
                  };
                }
                const val = Reflect.get(builderTarget, builderProp);
                if (typeof val === 'function') {
                  return function(...chainArgs) {
                    try {
                      const nextBuilder = val.apply(builderTarget, chainArgs);
                      return new Proxy(nextBuilder, this);
                    } catch (e) {
                      console.warn(`[SUPABASE PROXY] Chained method [${String(builderProp)}] failed:`, e);
                      return createMockQueryBuilder();
                    }
                  };
                }
                return val;
              }
            });
          } catch (e) {
            console.warn("supabase.from call failed:", e);
            return createMockQueryBuilder();
          }
        };
      }
      return () => createMockQueryBuilder();
    }

    if (activeClient) {
      try {
        const val = Reflect.get(activeClient, prop);
        if (typeof val === 'function') {
          return val.bind(activeClient);
        }
        return val;
      } catch (err) {
        console.warn(`[SUPABASE PROXY] Getter warning for key [${String(prop)}]:`, err?.message || err);
      }
    }

    return () => {};
  },
  set(target, prop, value, receiver) {
    if (!activeClient) {
      try {
        activeClient = createClient(DEFAULT_URL, DEFAULT_KEY);
      } catch (err) {
        return false;
      }
    }
    if (!activeClient) return false;
    try {
      return Reflect.set(activeClient, prop, value, receiver);
    } catch (e) {
      return false;
    }
  }
});

