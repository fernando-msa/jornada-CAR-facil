/**
 * SICAR (Sistema Nacional de Cadastro Ambiental Rural) Integration Service
 * Dataprev API Wrapper - Modo Dual (Produção + Demo/Hackathon)
 *
 * Em modo DEMO (padrão no hackathon): retorna dados simulados realistas.
 * Em modo PRODUÇÃO: conecta à API real da Dataprev via OAuth2 client_credentials.
 *
 * Para ativar o modo produção, passe { demoMode: false } no construtor
 * e forneça as credenciais reais (clientId, clientSecret).
 */

// ─────────────────────────────────────────────────────────────
// Banco de Dados Mock para Demonstração do haCARthon
// ─────────────────────────────────────────────────────────────
const MOCK_PROPERTIES_DB = {
  // Qualquer CPF retornará um destes perfis de demonstração
  default: [
    {
      codigo_imovel: 'BR-32-00508-7A2B-4E1F',
      nome_imovel: 'Sítio Boa Esperança',
      situacao_cadastro: 'ATIVO',
      area_calculada_ha: 45.2,
      municipio: 'Alegre',
      uf: 'ES',
      protocolo_registro: 'ES-2024-001247',
      data_atualizacao: '2024-08-15',
      geometria: {
        type: 'Polygon',
        coordinates: [[
          [-41.535, -20.765],
          [-41.530, -20.765],
          [-41.530, -20.760],
          [-41.535, -20.760],
          [-41.535, -20.765]
        ]]
      },
      areas_preservacao_permanente: [
        { tipo: 'Curso d\'água', area_ha: 2.3 }
      ],
      reserva_legal: {
        area_ha: 8.5,
        percentual: 18.8,
        situacao: 'PROPOSTA'
      },
      uso_consolidado: [
        { tipo: 'Pastagem', area_ha: 25.0 },
        { tipo: 'Agricultura', area_ha: 9.4 }
      ]
    }
  ],
  // CPF específico para cenário de múltiplos imóveis
  '98765432100': [
    {
      codigo_imovel: 'BR-31-01234-3C5D-8F2A',
      nome_imovel: 'Fazenda São João',
      situacao_cadastro: 'PENDENTE',
      area_calculada_ha: 120.8,
      municipio: 'Montes Claros',
      uf: 'MG',
      protocolo_registro: 'MG-2023-009821',
      data_atualizacao: '2023-11-20',
      geometria: null,
      areas_preservacao_permanente: [],
      reserva_legal: { area_ha: 20.0, percentual: 16.5, situacao: 'DEFICIT' },
      uso_consolidado: [{ tipo: 'Pecuária', area_ha: 85.0 }]
    },
    {
      codigo_imovel: 'BR-31-01234-9X7Z-1K4M',
      nome_imovel: 'Sítio Água Limpa',
      situacao_cadastro: 'ATIVO',
      area_calculada_ha: 22.5,
      municipio: 'Montes Claros',
      uf: 'MG',
      protocolo_registro: 'MG-2024-002110',
      data_atualizacao: '2024-05-10',
      geometria: null,
      areas_preservacao_permanente: [{ tipo: 'Nascente', area_ha: 0.8 }],
      reserva_legal: { area_ha: 5.2, percentual: 23.1, situacao: 'REGULAR' },
      uso_consolidado: [{ tipo: 'Horticultura', area_ha: 12.0 }]
    }
  ]
};


class SicarService {
  /**
   * @param {Object} config
   * @param {boolean} config.demoMode - true (padrão) usa dados mock; false tenta API real
   * @param {string}  config.baseUrl  - URL base da API SICAR (produção)
   * @param {string}  config.apiToken - Token já autenticado (opcional)
   */
  constructor(config = {}) {
    this.demoMode = config.demoMode !== undefined ? config.demoMode : true;
    this.baseUrl = config.baseUrl || 'https://api.sicar.dataprev.gov.br/v1';
    this.apiToken = config.apiToken || null;
    this._isAuthenticated = false;
  }

  // ═══════════════════════════════════════════════════════════
  //  AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════════════

  /**
   * Autentica com o gateway da Dataprev / SICAR.
   *
   * Em modo DEMO: simula o fluxo OAuth com delay realista e retorna token fictício.
   * Em modo PRODUÇÃO: executa o fluxo OAuth2 client_credentials real.
   *
   * @param {string} clientId
   * @param {string} clientSecret
   * @returns {Promise<string>} Access token
   */
  async authenticate(clientId, clientSecret) {
    // ── Modo Demo ──────────────────────────────────────────
    if (this.demoMode) {
      console.info('[SICAR Demo] Autenticação simulada com sucesso.');
      // Simula latência de rede (~300ms)
      await this._simulateDelay(300);

      this.apiToken = 'demo_token_hackarthon_2026_' + Date.now();
      this._isAuthenticated = true;
      return this.apiToken;
    }

    // ── Modo Produção ──────────────────────────────────────
    if (!clientId || !clientSecret) {
      throw new Error(
        'Credenciais ausentes. Forneça clientId e clientSecret para autenticação real com a Dataprev.'
      );
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'sicar:consulta:imovel',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Falha na autenticação Dataprev (HTTP ${response.status}): ${errorBody}`
        );
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error('Resposta da Dataprev não contém access_token.');
      }

      this.apiToken = data.access_token;
      this._isAuthenticated = true;
      return this.apiToken;
    } catch (error) {
      console.error('[SICAR Produção] Erro na autenticação:', error.message);
      // Fallback automático para modo demo se a API real estiver indisponível
      console.warn('[SICAR] API real indisponível. Ativando fallback para modo DEMO.');
      this.demoMode = true;
      return this.authenticate(clientId, clientSecret);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  CONSULTA DE IMÓVEIS POR CPF
  // ═══════════════════════════════════════════════════════════

  /**
   * Consulta os imóveis rurais cadastrados para um determinado CPF.
   *
   * @param {string} cpf - CPF com ou sem pontuação
   * @returns {Promise<Array>} Lista de imóveis simplificada para o frontend
   */
  async getPropertiesByCPF(cpf) {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new Error('CPF inválido. Deve conter 11 dígitos.');
    }

    // ── Modo Demo ──────────────────────────────────────────
    if (this.demoMode) {
      console.info(`[SICAR Demo] Consulta simulada para CPF: ***${cleanCpf.slice(-4)}`);
      await this._simulateDelay(800); // Simula tempo de resposta da API

      // Busca no banco mock pelo CPF ou retorna o perfil padrão
      const rawData = MOCK_PROPERTIES_DB[cleanCpf] || MOCK_PROPERTIES_DB.default;
      return this._mapPropertiesToUI(rawData);
    }

    // ── Modo Produção ──────────────────────────────────────
    try {
      const response = await this._request(`/imoveis/proprietario/${cleanCpf}`);
      return this._mapPropertiesToUI(response);
    } catch (error) {
      console.error(`[SICAR Produção] Erro ao consultar CPF ${cleanCpf.slice(-4)}:`, error.message);
      // Fallback automático para demo
      console.warn('[SICAR] Ativando fallback DEMO para consulta de imóveis.');
      this.demoMode = true;
      return this.getPropertiesByCPF(cpf);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  DETALHES DO IMÓVEL (GEOMETRIA, APP, RL)
  // ═══════════════════════════════════════════════════════════

  /**
   * Obtém detalhes completos de um imóvel específico incluindo geometria.
   * @param {string} propertyCode - Código CAR do imóvel (ex: BR-32-00508-...)
   */
  async getPropertyDetails(propertyCode) {
    // ── Modo Demo ──────────────────────────────────────────
    if (this.demoMode) {
      console.info(`[SICAR Demo] Detalhes simulados para imóvel: ${propertyCode}`);
      await this._simulateDelay(500);

      // Procura o imóvel no banco mock
      const allProperties = [
        ...MOCK_PROPERTIES_DB.default,
        ...(MOCK_PROPERTIES_DB['98765432100'] || []),
      ];
      const found = allProperties.find((p) => p.codigo_imovel === propertyCode);

      if (!found) {
        // Retorna o primeiro como fallback
        const fallback = MOCK_PROPERTIES_DB.default[0];
        return this._mapDetailsToUI(fallback);
      }

      return this._mapDetailsToUI(found);
    }

    // ── Modo Produção ──────────────────────────────────────
    try {
      const details = await this._request(`/imoveis/${propertyCode}`);
      return this._mapDetailsToUI(details);
    } catch (error) {
      console.error(`[SICAR Produção] Erro ao buscar detalhes de ${propertyCode}:`, error.message);
      this.demoMode = true;
      return this.getPropertyDetails(propertyCode);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  MÉTODOS PRIVADOS / HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Mapeia a resposta bruta da API para o schema simplificado do frontend.
   * @private
   */
  _mapPropertiesToUI(rawArray) {
    return rawArray.map((item) => ({
      id: item.codigo_imovel,
      name: item.nome_imovel || 'Imóvel sem nome registrado',
      status: item.situacao_cadastro,
      area: item.area_calculada_ha,
      municipality: item.municipio,
      uf: item.uf,
      protocol: item.protocolo_registro,
      lastUpdate: item.data_atualizacao,
      _isDemo: this.demoMode,
    }));
  }

  /**
   * Mapeia detalhes completos do imóvel para o schema do frontend.
   * @private
   */
  _mapDetailsToUI(details) {
    return {
      id: details.codigo_imovel,
      area: details.area_calculada_ha,
      geometry: details.geometria,
      appAreas: details.areas_preservacao_permanente || [],
      legalReserve: details.reserva_legal || {},
      consolidatedUse: details.uso_consolidado || [],
      _isDemo: this.demoMode,
    };
  }

  /**
   * Executa requisição HTTP autenticada para a API real.
   * @private
   */
  async _request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
      throw new Error(
        errorData.message || `SICAR API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Simula latência de rede para dar realismo visual ao modo demo.
   * @private
   */
  _simulateDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna se o serviço está operando em modo demonstração.
   */
  isDemoMode() {
    return this.demoMode;
  }
}

export default SicarService;
