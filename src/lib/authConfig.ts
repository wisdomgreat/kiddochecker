import { Configuration, LogLevel } from "@azure/msal-browser";

/**
 * Configuration object to be passed to MSAL instance on creation. 
 */
export const msalConfig: Configuration = {
    auth: {
        clientId: "e48264b2-de12-4444-a290-a8d7f3e3a525",
        authority: "https://kiddochecker.ciamlogin.com/08e0221b-0776-4500-8e5f-c6002cf868bc/v2.0", // Full CIAM Tenant Authority
        redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || "https://happy-glacier-0746a2210.7.azurestaticapps.net",
        postLogoutRedirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || "https://happy-glacier-0746a2210.7.azurestaticapps.net",
        knownAuthorities: ["kiddochecker.ciamlogin.com"], // Force trust for the CIAM domain
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        return;
                }
            }
        }
    }
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 */
export const loginRequest = {
    scopes: ["User.Read"]
};
