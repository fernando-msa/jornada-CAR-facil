import React, { useState } from 'react';
import GovBrService from '../services/govbr';

const Step1Welcome = ({ producer, setProducer, nextStep }) => {
  const [cpf, setCpf] = useState(producer.cpf);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // Format CPF (###.###.###-##)
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Apply formatting
    if (value.length > 9) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length > 6) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}.${value.slice(3)}`;
    }
    
    setCpf(value);
    setError('');
  };

  // Mock audio reader for Seu Raimundo (Accessibility)
  const speakInstructions = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }
      
      const message = new SpeechSynthesisUtterance(
        "Olá, produtor! Que bom ter você aqui. Nós ajudamos você a regularizar o seu sítio de forma rápida e segura. O Cadastro Ambiental Rural é o documento do seu sítio. Com ele em dia, o senhor consegue empréstimo no banco e evita multas. Digite o seu CPF abaixo e clique em Entrar com o gov.br para começarmos."
      );
      message.lang = 'pt-BR';
      message.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(message);
      setIsPlaying(true);
    } else {
      alert("A reprodução de áudio não é suportada no seu navegador.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setError('CPF inválido. Digite os 11 números.');
      return;
    }

    // Use gov.br mock service
    const govbr = new GovBrService({ clientId: 'jornada-car-facil' });
    // Simulate authentication
    setProducer({
      ...producer,
      cpf: cleanCpf,
      name: 'Raimundo Nonato de Souza',
      level: 'Prata', // Return Prata level to allow signing
      isAuthenticated: true
    });

    nextStep();
  };

  return (
    <div className="step-container">
      <div className="gov-demo-banner">
        🧪 <strong>Modo de Simulação Ativo:</strong> Insira qualquer CPF (ex: 123.456.789-00) para simular o acesso com dados de demonstração.
      </div>
      <h2 className="step-title">Bem-vindo, Produtor!</h2>
      <p className="step-description">
        O jeito mais simples e rápido de deixar o seu sítio em dia com as leis ambientais.
      </p>

      {/* Accessibility Voice Button */}
      <button 
        type="button" 
        onClick={speakInstructions} 
        style={styles.voiceBtn}
      >
        {isPlaying ? '⏹️ Parar Explicação' : '🔊 Escutar Explicação (Áudio)'}
      </button>

      <div className="gov-card">
        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label htmlFor="cpf-input" style={styles.label}>CPF do Produtor:</label>
            <input
              id="cpf-input"
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              style={styles.input}
              inputMode="numeric"
            />
            {error && <span style={styles.errorText}>{error}</span>}
          </div>

          <button 
            type="submit" 
            className="gov-btn gov-btn-primary"
            style={styles.govbrBtn}
          >
            Entrar com <span style={{ fontWeight: '800' }}>gov.br</span>
          </button>
        </form>
      </div>

      <div style={styles.infoBox}>
        <strong>Por que usar o gov.br?</strong>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
          Usando o login do governo, nós conseguimos puxar os dados do seu sítio automaticamente. É seguro e você não precisa digitar quase nada!
        </p>
      </div>
    </div>
  );
};

const styles = {
  formGroup: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  errorText: {
    color: '#d9534f',
    fontSize: '12px',
    marginTop: '5px',
    fontWeight: 'bold'
  },
  govbrBtn: {
    backgroundColor: '#0033c6',
    fontSize: '18px'
  },
  voiceBtn: {
    backgroundColor: '#e8f5e9',
    color: '#138013',
    border: '1px solid #138013',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  infoBox: {
    backgroundColor: '#f0f4f9',
    borderLeft: '4px solid #0033c6',
    padding: '12px',
    borderRadius: '0 4px 4px 0',
    fontSize: '13px',
    color: '#333',
    marginTop: 'auto'
  }
};

export default Step1Welcome;
