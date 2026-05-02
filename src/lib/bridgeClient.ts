import { apiFetch } from './apiClient';

/**
 * BridgeClient
 * A lightweight replacement for the Supabase client that routes 
 * requests through the Azure Data Bridge API.
 */
export const bridge = {
  /**
   * Proxies a database function call (RPC)
   * @param fn The name of the PostgreSQL function
   * @param params Parameters to pass to the function
   */
  rpc: async (fn: string, params: any = {}) => {
    try {
      return await apiFetch('/api/rpc', {
        method: 'POST',
        body: JSON.stringify({ fn, params })
      });
    } catch (error: any) {
      console.error(`[BridgeClient] RPC Error (${fn}):`, error);
      return { data: null, error };
    }
  },

  /**
   * Proxies a table query (Select)
   * @param table The table name
   */
  from: (table: string) => {
    return {
      select: (columns: string = '*') => {
        const filters: any[] = [];
        
        const builder = {
          eq: (column: string, value: any) => {
            filters.push({ column, value, operator: '=' });
            return builder;
          },
          gt: (column: string, value: any) => {
            filters.push({ column, value, operator: '>' });
            return builder;
          },
          lt: (column: string, value: any) => {
            filters.push({ column, value, operator: '<' });
            return builder;
          },
          // Execute the query
          then: async (onfulfilled?: (value: any) => any) => {
            try {
              const result = await apiFetch('/api/query', {
                method: 'POST',
                body: JSON.stringify({ table, select: columns, filters })
              });
              return onfulfilled ? onfulfilled(result) : result;
            } catch (error: any) {
              const res = { data: null, error };
              return onfulfilled ? onfulfilled(res) : res;
            }
          }
        };
        
        return builder;
      }
    };
  }
};
