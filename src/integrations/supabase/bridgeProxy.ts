import { apiFetch } from '@/lib/apiClient';

/**
 * A Robust Proxy for the Supabase Client
 * Redirects .from().select() and .rpc() to the Azure Bridge API
 * Gracefully handles missing methods (like realtime .channel())
 */
export const createBridgeProxy = () => {
  const createBuilder = (table: string) => {
    let filters: any[] = [];
    let selectCols = '*';

    const builder: any = {
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
      or: (condition: string) => {
        filters.push({ operator: 'or', value: condition });
        return builder;
      },
      in: (column: string, values: any[]) => {
        filters.push({ column, value: values, operator: 'in' });
        return builder;
      },
      limit: (count: number) => {
        filters.push({ operator: 'limit', value: count });
        return builder;
      },
      order: (column: string, { ascending = true } = {}) => {
        return builder;
      },
      single: async () => {
        const res = await apiFetch('/api/query', {
          method: 'POST',
          body: JSON.stringify({ table, select: selectCols, filters })
        });
        return { data: res.data?.[0] || null, error: res.error };
      },
      insert: (data: any) => {
        filters.push({ action: 'insert', data });
        return builder;
      },
      upsert: (data: any) => {
        filters.push({ action: 'upsert', data });
        return builder;
      },
      update: (data: any) => {
        filters.push({ action: 'update', data });
        return builder;
      },
      delete: () => {
        filters.push({ action: 'delete' });
        return builder;
      },
      single: async () => {
        const mutation = filters.find(f => f.action);
        if (mutation) {
          const res = await apiFetch('/api/mutate', {
            method: 'POST',
            body: JSON.stringify({ table, action: mutation.action, data: mutation.data, filters: filters.filter(f => !f.action) })
          });
          return { data: Array.isArray(res.data) ? res.data[0] : (res.data || null), error: res.error };
        }
        const res = await apiFetch('/api/query', {
          method: 'POST',
          body: JSON.stringify({ table, select: selectCols, filters })
        });
        return { data: res.data?.[0] || null, error: res.error };
      },
      then: async (resolve: any, reject: any) => {
        try {
          const mutation = filters.find(f => f.action);
          let res;
          if (mutation) {
            res = await apiFetch('/api/mutate', {
              method: 'POST',
              body: JSON.stringify({ table, action: mutation.action, data: mutation.data, filters: filters.filter(f => !f.action) })
            });
          } else {
            res = await apiFetch('/api/query', {
              method: 'POST',
              body: JSON.stringify({ table, select: selectCols, filters })
            });
          }
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }
    };

    // Proxy the builder to catch missing chaining methods
    return new Proxy(builder, {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        // Fallback for missing methods (returns builder for chaining)
        return () => builder;
      }
    });
  };

  const client: any = {
    from: (table: string) => createBuilder(table),
    rpc: async (fn: string, params: any = {}) => {
      const res = await apiFetch('/api/rpc', {
        method: 'POST',
        body: JSON.stringify({ fn, params })
      });
      return { data: res.data, error: res.error };
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} })
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: async () => {
        const profile = await apiFetch('/api/profile');
        return { data: { user: profile }, error: null };
      },
      signInWithPassword: async () => {
         throw new Error("Legacy sign-in is disabled. Please use Azure login.");
      }
    }
  };

  // Proxy the client to catch missing top-level methods
  return new Proxy(client, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      return () => client;
    }
  });
};
