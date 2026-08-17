import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";

import { supabase } from "@/integrations/supabase/client";

const msalInstance = new PublicClientApplication(msalConfig);

export const getAccessToken = async () => {
    // 0. Check Custom Bridge Token First
    const bridgeToken = localStorage.getItem('bridge_token');
    if (bridgeToken) {
        return bridgeToken;
    }

    // 1. Check MSAL (Microsoft)
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        try {
            const response = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            });
            return response.accessToken;
        } catch (error) {
            console.warn("[Bridge] Silent MSAL token acquisition failed");
        }
    }

    // 2. Fallback to Supabase (Email/Password)
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            return session.access_token;
        }
    } catch (e) {}

    // 3. Fallback client bridge token for kiosk / reports / read operations
    return 'kiddochecker-guest-token';
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getAccessToken();
    const baseUrl = import.meta.env.VITE_API_URL || "https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io";
    
    const headers = {
        ...options.headers,
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };

    const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Bridge] API Error: ${endpoint}`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
        });
        throw new Error(errorText || `API Request failed: ${response.statusText}`);
    }

    return response.json();
};
