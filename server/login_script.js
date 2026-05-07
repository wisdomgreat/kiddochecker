const axios = require('axios');

async function login() {
  const email = 'wisdom_borntobegreat@yahoo.com';
  const code = '649325';
  const apiBase = 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';
  
  console.log(`[Auth] Verifying code ${code} for ${email}...`);
  try {
    const response = await axios.post(`${apiBase}/api/auth/verify-code`, { email, code });
    console.log('[Auth] Token received:', response.data.token);
  } catch (err) {
    console.error('[Auth] Error verifying code:', err.response?.data || err.message);
  }
}

login();
