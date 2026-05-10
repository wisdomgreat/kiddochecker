import { createBridgeProxy } from '@/integrations/supabase/bridgeProxy';

/**
 * BridgeClient
 * A unified proxy that routes all requests through the Azure Data Bridge API.
 * This replaces the simplified bridge object and ensures consistent filter 
 * and mutation support across the app.
 */
export const bridge = createBridgeProxy();
