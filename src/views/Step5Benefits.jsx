import React from 'react';

const Step5Benefits = ({ diagnosis, nextStep, prevStep }) => {
  const { isSmallProperty } = diagnosis;

  return (
    <div className="step-container">
      <h2 className="step-title">Seus Benefícios Garantidos</h2>
      <p className="step-description">
        Ter o seu Cadastro Ambiental Rural (CAR) em dia abre portas para incentivos e protege o seu sítio:
      </p>

      <div style={styles.benefitsList}>
        <div className="gov-card" style={styles.benefitCard}>
          <span style={styles.benefitIcon}>💰</span>
          <div style={styles.benefitBody}>
            <strong>Crédito Rural PRONAF</strong>
            <p>Consiga empréstimos no banco com juros muito mais baixos para comprar sementes, ração e maquinário.</p>
          </div>
        </div>

        {isSmallProperty && (
          <div className="gov-card" style={styles.benefitCard}>
            <span style={styles.benefitIcon}>🛡️</span>
            <div style={styles.benefitBody}>
              <strong>Anistia de Multas e Isenções</strong>
              <p>Como pequeno produtor, você tem regras simplificadas de plantio e fica isento de taxas cartoriais.</p>
            </div>
          </div>
        )}

        <div className="gov-card" style={styles.benefitCard}>
          <span style={styles.benefitIcon}>🌾</span>
          <div style={styles.benefitBody}>
            <strong>Selo de Sítio Verde</strong>
            <p>Venda sua produção por preços melhores para programas de alimentação do governo (PNAE/PAA).</p>
          </div>
        </div>

        <div className="gov-card" style={styles.benefitCard}>
          <span style={styles.benefitIcon}>🤝</span>
          <div style={styles.benefitBody}>
            <strong>Proteção de Água do Gado</strong>
            <p>Garantia de que as nascentes que fornecem água para a sua família e rebanhos estarão seguras.</p>
          </div>
        </div>
      </div>

      <div style={styles.navigation}>
        <button 
          onClick={nextStep} 
          className="gov-btn gov-btn-success"
        >
          🏆 Concluir e Gerar Recibo
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
  benefitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px'
  },
  benefitCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 15px',
    margin: 0
  },
  benefitIcon: {
    fontSize: '24px',
    padding: '6px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px'
  },
  benefitBody: {
    fontSize: '13px',
    lineHeight: '1.4'
  },
  navigation: {
    marginTop: 'auto'
  }
};

export default Step5Benefits;
