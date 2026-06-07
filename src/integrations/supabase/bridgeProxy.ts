import { apiFetch } from '@/lib/apiClient';

/**
 * A Robust Proxy for the Supabase Client
 * Redirects .from().select() and .rpc() to the Azure Bridge API
 * Gracefully handles missing methods (like realtime .channel())
 * Delegates non-migrated features (storage, functions) to the real client
 */
export const createBridgeProxy = (realClient: any) => {
  const createBuilder = (table: string) => {
    let filters: any[] = [];
    let selectCols = '*';

    const exec = async (isQuery: boolean) => {
      let res;
      try {
        const mutation = filters.find(f => f.action);
        if (mutation) {
          console.log(`[BridgeProxy] Mutating ${table}:`, mutation.action, mutation.data);
          res = await apiFetch('/api/mutate', {
            method: 'POST',
            body: JSON.stringify({ 
              table, 
              action: mutation.action, 
              data: mutation.data, 
              options: mutation.options,
              filters: filters.filter(f => !f.action) 
            })
          });
        } else {
          res = await apiFetch('/api/query', {
            method: 'POST',
            body: JSON.stringify({ table, select: selectCols, filters })
          });
        }
        
        // Handle single() or maybeSingle() expectations
        const isSingle = filters.some(f => f.operator === 'single' || f.operator === 'maybeSingle');
        const data = isSingle ? (Array.isArray(res.data) ? res.data[0] : (res.data || null)) : res.data;
        
        return { data, error: res.error, count: res.count };
      } catch (err: any) {
        console.error(`[BridgeProxy] Error in ${isQuery ? 'query' : 'mutation'}:`, err);
        return { data: null, error: err.message || 'API request failed' };
      }
    };

    const builder: any = {
      select: (cols: string = '*') => {
        selectCols = cols;
        return proxy;
      },
      eq: (column: string, value: any) => {
        filters.push({ column, value, operator: '=' });
        return proxy;
      },
      neq: (column: string, value: any) => {
        filters.push({ column, value, operator: '!=' });
        return proxy;
      },
      gt: (column: string, value: any) => {
        filters.push({ column, value, operator: '>' });
        return proxy;
      },
      lt: (column: string, value: any) => {
        filters.push({ column, value, operator: '<' });
        return proxy;
      },
      gte: (column: string, value: any) => {
        filters.push({ column, value, operator: '>=' });
        return proxy;
      },
      lte: (column: string, value: any) => {
        filters.push({ column, value, operator: '<=' });
        return proxy;
      },
      like: (column: string, value: any) => {
        filters.push({ column, value, operator: 'LIKE' });
        return proxy;
      },
      ilike: (column: string, value: any) => {
        filters.push({ column, value, operator: 'ILIKE' });
        return proxy;
      },
      in: (column: string, values: any[]) => {
        filters.push({ column, value: values, operator: 'IN' });
        return proxy;
      },
      is: (column: string, value: any) => {
        if (value === null) {
          filters.push({ column, operator: 'IS NULL' });
        } else {
          filters.push({ column, value, operator: '=' });
        }
        return proxy;
      },
      or: (filter: string) => {
        filters.push({ operator: 'OR', value: filter });
        return proxy;
      },
      contains: (column: string, value: any) => {
        filters.push({ column, value, operator: 'CONTAINS' });
        return proxy;
      },
      single: () => {
        filters.push({ operator: 'single' });
        return proxy;
      },
      maybeSingle: () => {
        filters.push({ operator: 'maybeSingle' });
        return proxy;
      },
      limit: (count: number) => {
        filters.push({ operator: 'limit', value: count });
        return proxy;
      },
      order: (column: string, { ascending = true } = {}) => {
        filters.push({ operator: 'order', column, value: ascending ? 'ASC' : 'DESC' });
        return proxy;
      },
      insert: (data: any) => {
        filters.push({ action: 'insert', data });
        return proxy;
      },
      upsert: (data: any, options: any = {}) => {
        filters.push({ action: 'upsert', data, options });
        return proxy;
      },
      update: (data: any) => {
        filters.push({ action: 'update', data });
        return proxy;
      },
      delete: () => {
        filters.push({ action: 'delete' });
        return proxy;
      },
      match: (obj: any) => {
        Object.entries(obj).forEach(([k, v]) => filters.push({ column: k, value: v, operator: '=' }));
        return proxy;
      },
      not: (column: string, operator: string, value: any) => {
        filters.push({ column, value, operator: `NOT ${operator}` });
        return proxy;
      },
      then: async (resolve: any, reject: any) => {
        const res = await exec(false);
        if (res.error && !res.data) reject(res.error);
        else resolve(res);
      }
    };

    const proxy: any = new Proxy(builder, {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        // Fallback for missing methods (returns builder for chaining)
        return () => proxy;
      }
    });

    return proxy;
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
    auth: {
      getSession: async () => {
        const token = localStorage.getItem('bridge_token');
        if (!token) return { data: { session: null }, error: null };
        try {
          const profile = await apiFetch('/api/profile');
          return { data: { session: { access_token: token, user: profile } }, error: null };
        } catch (e) {
          return { data: { session: null }, error: e };
        }
      },
      getUser: async () => {
        const token = localStorage.getItem('bridge_token');
        if (!token) return { data: { user: null }, error: null };
        try {
          const profile = await apiFetch('/api/profile');
          return { data: { user: profile }, error: null };
        } catch (e) {
          return { data: { user: null }, error: e };
        }
      },
      onAuthStateChange: (callback: any) => {
        // Mock implementation
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: async () => {
        localStorage.removeItem('bridge_token');
        return { error: null };
      },
      signUp: async ({ email, password, options }: any) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              firstName: options?.data?.first_name || '',
              lastName: options?.data?.last_name || '',
              phone: options?.data?.phone || '',
              role: options?.data?.role || 'parent'
            })
          });
          if (!res.ok) {
            const error = await res.json();
            return { data: { session: null, user: null }, error: new Error(error.error || 'Signup failed') };
          }
          const data = await res.json();
          const { token, profile } = data;
          if (token) {
            localStorage.setItem('bridge_token', token);
          }
          
          const sbUser = {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              first_name: profile.first_name,
              last_name: profile.last_name,
              phone: profile.phone
            }
          };

          return {
            data: {
              session: token ? { access_token: token, user: sbUser } : null,
              user: sbUser
            },
            error: null
          };
        } catch (e: any) {
          return { data: { session: null, user: null }, error: e };
        }
      },
      signInWithPassword: async ({ email, password }: any) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (!res.ok) {
            const error = await res.json();
            return { data: { session: null, user: null }, error: new Error(error.error || 'Login failed') };
          }
          const data = await res.json();
          if (data.mfaRequired) {
            return { data: { mfaRequired: true, email: data.email }, error: null };
          }
          const { token, profile } = data;
          localStorage.setItem('bridge_token', token);
          return { data: { session: { access_token: token, user: profile }, user: profile }, error: null };
        } catch (e: any) {
          return { data: { session: null, user: null }, error: e };
        }
      },
      setSession: async (session: any) => {
        if (session?.access_token) {
          localStorage.setItem('bridge_token', session.access_token);
        }
        return { data: { session }, error: null };
      },
      mfa: {
        listFactors: async () => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/mfa/list`, {
              headers: { 
                'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
              }
            });
            if (!res.ok) return { data: { all: [] }, error: new Error('Failed to list factors') };
            const data = await res.json();
            return { data: { all: data.all || [] }, error: null };
          } catch (e: any) {
            return { data: { all: [] }, error: e };
          }
        },
        enroll: async ({ friendlyName, issuer }: any) => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/mfa/enroll`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
              },
              body: JSON.stringify({ friendlyName, issuer })
            });
            if (!res.ok) {
              const error = await res.json();
              return { data: null, error: new Error(error.error || 'Failed to enroll') };
            }
            const data = await res.json();
            return { data, error: null };
          } catch (e: any) {
            return { data: null, error: e };
          }
        },
        challenge: async ({ factorId }: any) => {
          return { data: { id: 'mock-challenge-id' }, error: null };
        },
        verify: async ({ factorId, challengeId, code }: any) => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/mfa/verify`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
              },
              body: JSON.stringify({ factorId, challengeId, code })
            });
            if (!res.ok) {
              const error = await res.json();
              return { data: null, error: new Error(error.error || 'Failed to verify') };
            }
            const data = await res.json();
            return { data, error: null };
          } catch (e: any) {
            return { data: null, error: e };
          }
        },
        unenroll: async ({ factorId }: any) => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/mfa/unenroll`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
              },
              body: JSON.stringify({ factorId })
            });
            if (!res.ok) {
              const error = await res.json();
              return { data: null, error: new Error(error.error || 'Failed to unenroll') };
            }
            const data = await res.json();
            return { data, error: null };
          } catch (e: any) {
            return { data: null, error: e };
          }
        }
      }
    },
    // Realistic mock for realtime channels
    channel: (name: string) => ({
      on: () => ({ subscribe: (cb: any) => { if (cb) cb('SUBSCRIBED'); } }),
      subscribe: (cb: any) => { if (cb) cb('SUBSCRIBED'); return { unsubscribe: () => {} }; },
      unsubscribe: () => {}
    }),
    removeChannel: () => {},
    // Delegate non-migrated features to the real client
    storage: realClient?.storage,
    functions: realClient?.functions,
  };

  return new Proxy(client, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      if (realClient && prop in realClient) return realClient[prop];
      return () => client;
    }
  });
};
