import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

export const getAccessToken = async () => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        try {
            const response = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            });
            return response.accessToken;
        } catch (error) {
            console.error("Silent token acquisition failed, redirecting to login", error);
            // If silent fails, we might need to prompt the user, 
            // but for API calls we usually just return null and let the UI handle it
            return null;
        }
    }
    return null;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getAccessToken();
    const baseUrl = import.meta.env.VITE_API_URL || "https://ca-data-bridge-api.gentleocean-21665a39.eastus.azurecontainerapps.io";
    
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
        const error = await response.text();
        throw new Error(error || "API Request failed");
    }

    return response.json();
};
