/**
 * SICAR (Sistema Nacional de Cadastro Ambiental Rural) Integration Service
 * Dataprev API Wrapper
 */

class SicarService {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://api.sicar.dataprev.gov.br/v1';
    this.apiToken = config.apiToken || null;
  }

  /**
   * Helper to perform authenticated HTTP requests
   */
  async _request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `SICAR API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Authenticate with Dataprev / SICAR gateway
   * @param {string} clientId 
   * @param {string} clientSecret 
   */
  async authenticate(clientId, clientSecret) {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'sicar:consulta:imovel'
      })
    });

    if (!response.ok) {
      throw new Error('Authentication with Dataprev failed');
    }

    const data = await response.json();
    this.apiToken = data.access_token;
    return this.apiToken;
  }

  /**
   * Consult rural properties registered under a specific CPF
   * @param {string} cpf - Clean CPF string (digits only)
   * @returns {Promise<Array>} List of registered properties
   */
  async getPropertiesByCPF(cpf) {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new Error('CPF inválido. Deve conter 11 dígitos.');
    }

    try {
      // Endpoint standard format for querying by owner document number
      const response = await this._request(`/imoveis/proprietario/${cleanCpf}`);
      
      // Map response to simplified schema for Seu Raimundo's UI
      return response.map(item => ({
        id: item.codigo_imovel,
        name: item.nome_imovel || 'Imóvel sem nome registrado',
        status: item.situacao_cadastro, // 'ATIVO', 'PENDENTE', 'CANCELADO'
        area: item.area_calculada_ha, // in hectares
        municipality: item.municipio,
        uf: item.uf,
        protocol: item.protocolo_registro,
        lastUpdate: item.data_atualizacao
      }));
    } catch (error) {
      console.error(`Error fetching properties for CPF ${cleanCpf}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed info of a specific property including shapefiles metadata
   * @param {string} propertyCode - CAR Registry Code (e.g. BR-XXXXX-...)
   */
  async getPropertyDetails(propertyCode) {
    try {
      const details = await this._request(`/imoveis/${propertyCode}`);
      return {
        id: details.codigo_imovel,
        area: details.area_calculada_ha,
        geometry: details.geometria, // GeoJSON format from SICAR
        appAreas: details.areas_preservacao_permanente || [],
        legalReserve: details.reserva_legal || {},
        consolidatedUse: details.uso_consolidado || []
      };
    } catch (error) {
      console.error(`Error fetching property details for ${propertyCode}:`, error);
      throw error;
    }
  }
}

export default SicarService;
