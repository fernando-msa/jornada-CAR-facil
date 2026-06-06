import React, { useState } from 'react';
import { generateCarReportPDF } from '../utils/pdfGenerator';
import { clearLocalDraft } from '../utils/offlineStore';

const Step6Share = ({ producer, property, diagnosis, prevStep }) => {
  const [downloaded, setDownloaded] = useState(false);

  // Trigger PDF Generation
  const handleDownloadPDF = async () => {
    try {
      const doc = await generateCarReportPDF({
        producer,
        property,
        diagnosis
      });
      doc.save(`CAR_Facil_${property.name.replace(/\s+/g, '_')}.pdf`);
      setDownloaded(true);
      
      // Clear offline draft once successfully generated/downloaded
      if (producer.cpf) {
        await clearLocalDraft(producer.cpf);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Erro ao gerar o PDF. Verifique os dados.');
    }
  };

  // WhatsApp receipt sharing helper
  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Concluí meu diagnóstico ambiental no app Jornada CAR Fácil para a propriedade ${property.name} (${property.areaHa} ha). O comprovante está pronto para o banco!`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  return (
    <div className="step-container" style={{ textAlign: 'center' }}>
      <div style={styles.successHeader}>
        <div style={styles.sealIcon}>🎖️</div>
        <h2 style={styles.successTitle}>Sítio Regularizado!</h2>
        <p style={styles.successSub}>
          Parabéns, Seu Raimundo! O diagnóstico prévio do seu CAR foi emitido com sucesso.
        </p>
      </div>

      <div className="gov-card" style={styles.summaryCard}>
        <div style={styles.summaryRow}>
          <span>Produtor:</span>
          <strong>{producer.name}</strong>
        </div>
        <div style={styles.summaryRow}>
          <span>Sítio:</span>
          <strong>{property.name}</strong>
        </div>
        <div style={styles.summaryRow}>
          <span>Área:</span>
          <strong>{property.areaHa.toFixed(1)} ha</strong>
        </div>
        <div style={styles.summaryRow}>
          <span>Situação:</span>
          <span style={styles.statusBadge}>Aprovado para Cadastro</span>
        </div>
      </div>

      <div style={styles.actionSection}>
        <button 
          onClick={handleDownloadPDF} 
          className="gov-btn gov-btn-primary"
          style={styles.downloadBtn}
        >
          📥 Baixar PDF da Declaração
        </button>

        <button 
          onClick={handleShareWhatsApp} 
          className="gov-btn gov-btn-success"
          style={styles.whatsappBtn}
        >
          💬 Enviar pelo WhatsApp
        </button>

        {downloaded && (
          <div style={styles.feedbackMsg}>
            🎉 O PDF foi salvo na sua pasta de downloads. Você já pode enviá-lo ao banco!
          </div>
        )}

        <button 
          onClick={prevStep} 
          className="gov-btn gov-btn-secondary"
          style={{ marginTop: '10px' }}
        >
          ⬅️ Voltar e Corrigir
        </button>
      </div>
    </div>
  );
};

const styles = {
  successHeader: {
    padding: '10px 0 20px 0'
  },
  sealIcon: {
    fontSize: '64px',
    marginBottom: '10px'
  },
  successTitle: {
    color: '#138013',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 10px 0'
  },
  successSub: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    lineHeight: '1.4'
  },
  summaryCard: {
    textAlign: 'left',
    padding: '15px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px'
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  actionSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  downloadBtn: {
    backgroundColor: '#0033c6',
    fontSize: '16px'
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    border: 'none',
    fontSize: '16px'
  },
  feedbackMsg: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginTop: '5px'
  }
};

export default Step6Share;
