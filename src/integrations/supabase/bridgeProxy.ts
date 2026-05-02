import { apiFetch } from '@/lib/apiClient';

/**
 * A Minimal Proxy for the Supabase Client
 * Redirects .from().select() and .rpc() to the Azure Bridge API
 */
export const createBridgeProxy = () => {
  const handler = {
    from: (table: string) => {
      let filters: any[] = [];
      let selectCols = '*';

      const builder = {
        select: (cols = '*') => {
          selectCols = cols;
          return builder;
        },
        eq: (column: string, value: any) => {
          filters.push({ column, value, operator: '=' });
          return builder;
        },
        neq: (column: string, value: any) => {
          filters.push({ column, value, operator: '<>' });
          return builder;
        },
        order: (column: string, { ascending = true } = {}) => {
          // Simplified order handling for the bridge
          return builder;
        },
        single: async () => {
          const res = await apiFetch('/api/query', {
            method: 'POST',
            body: JSON.stringify({ table, select: selectCols, filters })
          });
          return { data: res.data?.[0] || null, error: res.error };
        },
        insert: async (data: any) => {
          const res = await apiFetch('/api/mutate', {
            method: 'POST',
            body: JSON.stringify({ table, action: 'insert', data })
          });
          return { data: res.data?.[0] || null, error: res.error };
        },
        update: async (data: any) => {
          const res = await apiFetch('/api/mutate', {
            method: 'POST',
            body: JSON.stringify({ table, action: 'update', data, filters })
          });
          return { data: res.data || null, error: res.error };
        },
        delete: async () => {
          const res = await apiFetch('/api/mutate', {
            method: 'POST',
            body: JSON.stringify({ table, action: 'delete', filters })
          });
          return { data: res.data || null, error: res.error };
        },
        // Allow the builder to be awaited directly for .select() calls
        then: async (resolve: any, reject: any) => {
          try {
            const res = await apiFetch('/api/query', {
              method: 'POST',
              body: JSON.stringify({ table, select: selectCols, filters })
            });
            resolve(res);
          } catch (err) {
            reject(err);
          }
        }
      };

      return builder;
    },
    rpc: async (fn: string, params: any = {}) => {
      const res = await apiFetch('/api/rpc', {
        method: 'POST',
        body: JSON.stringify({ fn, params })
      });
      return { data: res.data, error: res.error };
    },
    auth: {
      getSession: async () => {
         // Dummy for compatibility, AuthContext handles the real session
         return { data: { session: null }, error: null };
      },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => {
         throw new Error("Legacy sign-in is disabled during migration. Please use Azure login.");
      }
    }
  };

  return handler as any;
};
