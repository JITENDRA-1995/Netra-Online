import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const makeMockSupabase = () => {
  console.warn(
    "Supabase credentials are missing. Running in Resilient Fallback Mode with local mockup data. " +
    "Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Environment Variables to go live."
  );
  
  const handler = {
    get(target, prop) {
      if (prop === 'auth') {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null })
        };
      }
      if (prop === 'storage') {
        return {
          from: () => ({
            upload: async () => ({ data: null, error: new Error("Supabase credentials not configured.") }),
            getPublicUrl: () => ({ data: { publicUrl: "" } })
          })
        };
      }
      if (prop === 'channel') {
        return () => ({
          on: () => ({
            subscribe: () => {}
          })
        });
      }
      if (prop === 'from') {
        return (tableName) => {
          const chain = {};
          const dummyResponse = { data: [], error: null };
          
          const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'limit', 'range'];
          chainMethods.forEach(method => {
            chain[method] = () => {
              const promise = Promise.resolve(dummyResponse);
              Object.assign(promise, chain);
              return promise;
            };
          });
          return chain;
        };
      }
      return () => {};
    }
  };
  return new Proxy({}, handler);
};

let clientInstance;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-ref')) {
  clientInstance = makeMockSupabase();
} else {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client. Falling back to mock client:", err);
    clientInstance = makeMockSupabase();
  }
}

export const supabase = clientInstance;
