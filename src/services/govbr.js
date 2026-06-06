/**
 * Gov.br OAuth2 Integration Service
 * Follows the official standard login protocol (Authorization Code Flow)
 */

class GovBrService {
  constructor(config = {}) {
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.redirectUri = config.redirectUri || '';
    
    // gov.br endpoints (Homologation vs Production)
    this.authorizeUrl = config.isProduction 
      ? 'https://sso.acesso.gov.br/authorize' 
      : 'https://sso.staging.acesso.gov.br/authorize';
    
    this.tokenUrl = config.isProduction 
      ? 'https://sso.acesso.gov.br/token' 
      : 'https://sso.staging.acesso.gov.br/token';
      
    this.userInfoUrl = config.isProduction 
      ? 'https://sso.acesso.gov.br/userinfo' 
      : 'https://sso.staging.acesso.gov.br/userinfo';
  }

  /**
   * Generates the Gov.br authorization URL to redirect the user to.
   * Includes standard scopes: openid, email, profile, govbr_confiabilidades
   * @param {string} state - Random CSRF protection token
   */
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile govbr_confiabilidades',
      state: state
    });

    return `${this.authorizeUrl}?${params.toString()}`;
  }

  /**
   * Exchanges the Authorization Code for an Access Token
   * @param {string} code - The code returned by Gov.br in the redirect URL
   */
  async getAccessToken(code) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri
    });

    // Gov.br authorization header requires Basic Auth with Client ID & Secret
    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Gov.br OAuth token exchange failed: ${response.status} - ${errorMsg}`);
    }

    return response.json(); // Returns { access_token, id_token, token_type, expires_in, scope }
  }

  /**
   * Fetches the user profile details from Gov.br
   * @param {string} accessToken 
   */
  async getUserInfo(accessToken) {
    const response = await fetch(this.userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info from Gov.br: ${response.status}`);
    }

    const data = await response.json();
    
    // Schema mapping for internal application usage
    return {
      cpf: data.sub, // In Gov.br, standard user identifier 'sub' is the CPF
      fullName: data.name,
      email: data.email,
      phone: data.phone_number,
      // Reliability level (Bronze, Prata, Ouro) which determines the actions allowed in CAR
      level: this._extractGovBrLevel(data.reliability_levels || [])
    };
  }

  /**
   * Private helper to parse Gov.br reliability credentials (Bronze/Prata/Ouro)
   */
  _extractGovBrLevel(levels) {
    // Gov.br categories: Bronze (basic), Prata (bank validation/validations), Ouro (biometrics/digital cert)
    if (levels.includes('OURO') || levels.includes('ouro')) return 'Ouro';
    if (levels.includes('PRATA') || levels.includes('prata')) return 'Prata';
    return 'Bronze';
  }
}

export default GovBrService;
