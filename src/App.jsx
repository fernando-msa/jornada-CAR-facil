import React, { useState, useEffect } from 'react';
import Step1Welcome from './views/Step1Welcome';
import Step2Diagnose from './views/Step2Diagnose';
import Step3Mapping from './views/Step3Mapping';
import Step4Valida from './views/Step4Valida';
import Step5Benefits from './views/Step5Benefits';
import Step6Share from './views/Step6Share';

import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Shared global state for Seu Raimundo's CAR journey
  const [producer, setProducer] = useState({
    name: 'Raimundo Nonato de Souza',
    cpf: '',
    level: 'Bronze', // Bronze, Prata, Ouro
    isAuthenticated: false
  });

  const [property, setProperty] = useState({
    name: 'Sítio Boa Esperança',
    registryCode: 'BR-32-00508-CAR',
    areaHa: 45.2,
    municipality: 'Alegre',
    uf: 'ES',
    geometry: null // GeoJSON drawn by user
  });

  const [diagnosis, setDiagnosis] = useState({
    propertyAreaHa: 45.2,
    fiscalModules: 0.9, // small property (< 4 Modules)
    isSmallProperty: true,
    app: {
      totalHa: 0,
      preservedHa: 0,
      degradedHa: 0,
      requiredBufferMeters: 5
    },
    legalReserve: {
      requiredHa: 9.04,
      existingHa: 8.5,
      status: 'COMPLIANT'
    },
    alerts: []
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simple next/prev routing helper
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Render current view
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Welcome 
            producer={producer} 
            setProducer={setProducer} 
            nextStep={nextStep} 
          />
        );
      case 2:
        return (
          <Step2Diagnose 
            producer={producer} 
            property={property} 
            setProperty={setProperty} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 3:
        return (
          <Step3Mapping 
            property={property} 
            setProperty={setProperty} 
            setDiagnosis={setDiagnosis}
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 4:
        return (
          <Step4Valida 
            diagnosis={diagnosis} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 5:
        return (
          <Step5Benefits 
            diagnosis={diagnosis} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        );
      case 6:
        return (
          <Step6Share 
            producer={producer} 
            property={property} 
            diagnosis={diagnosis} 
            prevStep={prevStep} 
          />
        );
      default:
        return <Step1Welcome producer={producer} setProducer={setProducer} nextStep={nextStep} />;
    }
  };

  return (
    <div className="gov-app-container">
      {/* 🇧🇷 Header Padrão gov.br Simplificado */}
      <header className="gov-header">
        <div className="gov-header-bar">
          <span className="gov-logo-text">gov<span className="gov-logo-dot">.br</span></span>
          <span className="gov-app-title">
            Cadastro Ambiental Rural <span className="gov-demo-badge">Demo / Simulador</span>
          </span>
        </div>
        {isOffline && (
          <div className="gov-offline-banner">
            📴 Modo Offline Ativo. Seus dados estão protegidos localmente.
          </div>
        )}
      </header>

      {/* 📊 Barra de Progresso Acessível */}
      <div className="gov-progress-section">
        <div className="gov-progress-text">
          <span>Passo <strong>{currentStep}</strong> de 6</span>
          <span className="gov-step-name">
            {currentStep === 1 && 'Identificação'}
            {currentStep === 2 && 'Dados do Imóvel'}
            {currentStep === 3 && 'Mapa da Terra'}
            {currentStep === 4 && 'Análise do Solo'}
            {currentStep === 5 && 'Seus Benefícios'}
            {currentStep === 6 && 'Comprovante'}
          </span>
        </div>
        <div className="gov-progress-track">
          <div 
            className="gov-progress-bar" 
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* 📱 Main Step Content Area */}
      <main className="gov-main-content">
        {renderStep()}
      </main>

      {/* 🇧🇷 Rodapé Padrão gov.br */}
      <footer className="gov-footer">
        <p>Jornada CAR Fácil • Ministério do Meio Ambiente e Dataprev</p>
        <small>haCARthon 2026 - Inovação Pública e Acessibilidade</small>
      </footer>
    </div>
  );
}

export default App;
