import React, { useEffect, useState } from 'react';
import SicarService from '../services/sicar';

const Step2Diagnose = ({ producer, property, setProperty, nextStep, prevStep }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function loadSicarData() {
      try {
        // Instancia o serviço (demoMode: true é o padrão no hackathon)
        const sicar = new SicarService({ demoMode: true });

        // Etapa 1: Autenticação com o gateway Dataprev
        await sicar.authenticate('jornada-car-facil', 'hackathon-2026');

        // Etapa 2: Consulta de imóveis pelo CPF do produtor
        const properties = await sicar.getPropertiesByCPF(producer.cpf || '12345678901');

        // Rastreia se os dados vieram do mock
        setIsDemo(sicar.isDemoMode());
        
        if (properties && properties.length > 0) {
          const p = properties[0];
          setProperty({
            name: p.name,
            registryCode: p.id,
            areaHa: p.area,
            municipality: p.municipality,
            uf: p.uf,
            geometry: null
          });
        }
      } catch (err) {
        console.error(err);
        setError('Não foi possível obter os dados do SICAR. Vamos preencher manualmente.');
      } finally {
        setLoading(false);
      }
    }

    loadSicarData();
  }, [producer.cpf, setProperty]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Buscando dados da sua terra no SICAR...</p>
      </div>
    );
  }

  return (
    <div className="step-container">
      <h2 className="step-title">Encontramos o seu Sítio!</h2>
      <p className="step-description">
        O sistema do governo encontrou esta propriedade registrada em seu nome. Veja se está correto:
      </p>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div className="gov-card" style={styles.card}>
        {isDemo && (
          <div style={styles.demoNotice}>
            🧪 <strong>DADOS DEMO:</strong> Autenticação simulada. Informações carregadas do banco de demonstração do haCARthon. Em produção, estes dados virão da API real do SICAR/Dataprev.
          </div>
        )}
        <div style={styles.row}>
          <span style={styles.label}>Nome do Sítio:</span>
          <strong style={styles.val}>{property.name}</strong>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Município:</span>
          <strong style={styles.val}>{property.municipality} - {property.uf}</strong>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Tamanho Cadastrado:</span>
          <strong style={styles.val}>{property.areaHa.toFixed(1)} Hectares</strong>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Código do Imóvel (CAR):</span>
          <code style={styles.code}>{property.registryCode}</code>
        </div>
      </div>

      <div style={styles.confirmBox}>
        <p style={{ margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.4' }}>
          Tudo certo com estes dados? No próximo passo, vamos conferir a cerca e as matas da sua terra.
        </p>

        <button 
          onClick={nextStep} 
          className="gov-btn gov-btn-success"
        >
          ✅ Sim, está correto! Ir para o mapa
        </button>

        <button 
          onClick={prevStep} 
          className="gov-btn gov-btn-secondary"
        >
          ⬅️ Voltar
        </button>
      </div>
    </div>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '250px',
    color: '#666'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #0033c6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px'
  },
  card: {
    borderLeft: '4px solid #138013',
    padding: '20px'
  },
  demoNotice: {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #1565c0',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#1565c0',
    marginBottom: '15px',
    textAlign: 'left'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  label: {
    color: '#666',
    fontSize: '14px'
  },
  val: {
    color: '#333',
    fontSize: '15px'
  },
  code: {
    backgroundColor: '#eee',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  errorBanner: {
    backgroundColor: '#fde8e8',
    color: '#c53030',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px'
  },
  confirmBox: {
    marginTop: 'auto'
  }
};

// CSS Keyframes are injected in main app stylesheet
export default Step2Diagnose;
