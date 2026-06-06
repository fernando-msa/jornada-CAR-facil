import React from 'react';

const Step4Valida = ({ diagnosis, nextStep, prevStep }) => {
  const { propertyAreaHa, app, legalReserve, alerts } = diagnosis;

  return (
    <div className="step-container">
      <h2 className="step-title">Saúde Ambiental da sua Terra</h2>
      <p className="step-description">
        Nosso sistema cruzou o desenho do seu sítio com as águas e florestas da região. Veja como você está ajudando a natureza:
      </p>

      {/* Render validation alert cards */}
      <div style={styles.alertList}>
        {alerts.length > 0 ? (
          alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className="gov-card" 
              style={{ 
                ...styles.alertCard, 
                borderLeftColor: 
                  alert.type === 'SUCCESS' ? '#2e7d32' : 
                  alert.type === 'WARNING' ? '#ef6c00' : 
                  alert.type === 'DANGER' ? '#c62828' : '#1565c0',
                backgroundColor:
                  alert.type === 'SUCCESS' ? '#e8f5e9' : 
                  alert.type === 'WARNING' ? '#fff3e0' : 
                  alert.type === 'DANGER' ? '#ffebee' : '#e3f2fd'
              }}
            >
              <div style={styles.cardHeader}>
                <span style={styles.icon}>
                  {alert.type === 'SUCCESS' && '🌳'}
                  {alert.type === 'WARNING' && '⚠️'}
                  {alert.type === 'DANGER' && '🚨'}
                  {alert.type === 'INFO' && '💡'}
                </span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: 
                    alert.type === 'SUCCESS' ? '#2e7d32' : 
                    alert.type === 'WARNING' ? '#ef6c00' : 
                    alert.type === 'DANGER' ? '#c62828' : '#1565c0'
                }}>
                  {alert.title}
                </span>
              </div>
              <p style={styles.alertText}>{alert.message}</p>
            </div>
          ))
        ) : (
          <div className="gov-card" style={styles.neutralCard}>
            <p>Tudo parece correto com os dados do imóvel. Não encontramos nenhuma pendência crítica!</p>
          </div>
        )}
      </div>

      <div style={styles.metricSummary}>
        <div style={styles.metricItem}>
          <span>Área Total</span>
          <strong>{propertyAreaHa.toFixed(1)} ha</strong>
        </div>
        <div style={styles.divider}></div>
        <div style={styles.metricItem}>
          <span>Mata APP</span>
          <strong>{app.totalHa.toFixed(1)} ha</strong>
        </div>
        <div style={styles.divider}></div>
        <div style={styles.metricItem}>
          <span>Reserva Legal</span>
          <strong>{legalReserve.existingHa.toFixed(1)} ha</strong>
        </div>
      </div>

      <div style={styles.navigation}>
        <button 
          onClick={nextStep} 
          className="gov-btn gov-btn-primary"
        >
          Avançar para Benefícios ➡️
        </button>

        <button 
          onClick={prevStep} 
          className="gov-btn gov-btn-secondary"
        >
          ⬅️ Corrigir Desenho
        </button>
      </div>
    </div>
  );
};

const styles = {
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  alertCard: {
    borderLeftWidth: '5px',
    margin: 0,
    padding: '12px 15px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    fontSize: '15px'
  },
  icon: {
    fontSize: '18px'
  },
  alertText: {
    margin: 0,
    fontSize: '13px',
    color: '#444',
    lineHeight: '1.4'
  },
  neutralCard: {
    borderLeft: '4px solid #7f8c8d',
    padding: '15px',
    color: '#555'
  },
  metricSummary: {
    display: 'flex',
    backgroundColor: '#f1f3f5',
    padding: '12px',
    borderRadius: '8px',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: '20px'
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '12px',
    color: '#666',
    gap: '3px'
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#ccc'
  },
  navigation: {
    marginTop: 'auto'
  }
};

export default Step4Valida;
