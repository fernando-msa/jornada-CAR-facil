import React, { useState } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { validatePropertyCAR } from '../utils/geoValidation';

const Step3Mapping = ({ property, setProperty, setDiagnosis, nextStep, prevStep }) => {
  const [polygonDrawn, setPolygonDrawn] = useState(false);
  const [tempGeometry, setTempGeometry] = useState(null);

  // Handle polygon save from Leaflet map
  const handlePolygonSaved = (geojson) => {
    setTempGeometry(geojson);
    setPolygonDrawn(true);
  };

  // Run validation and advance
  const handleConfirm = () => {
    if (!tempGeometry) return;

    // Mock geospatial features for validation (simulating hydrography and forest layers)
    // In a real-world scenario, these would be fetched from WMS/WFS based on boundary bounding box
    const mockHydrography = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-47.885, -15.794],
          [-47.880, -15.795]
        ]
      }
    };

    const mockForestCover = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-47.890, -15.800],
          [-47.870, -15.800],
          [-47.870, -15.790],
          [-47.890, -15.790],
          [-47.890, -15.800]
        ]]
      }
    };

    // Run Turf.js logic
    const validationResults = validatePropertyCAR(
      tempGeometry,
      mockHydrography,
      mockForestCover,
      50 // Fiscal Module size in hectares
    );

    setProperty(prev => ({ ...prev, geometry: tempGeometry }));
    setDiagnosis(validationResults);
    nextStep();
  };

  // WhatsApp helper to invite a technician
  const inviteTechnician = () => {
    const message = encodeURIComponent(
      `Olá! Estou usando o aplicativo Jornada CAR Fácil para regularizar o meu sítio (${property.name}). Você poderia me ajudar a conferir os limites do meu terreno? Aqui está o código do meu imóvel: ${property.registryCode}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  return (
    <div className="step-container">
      <h2 className="step-title">Desenhe o seu Sítio</h2>
      <p className="step-description">
        Use o mapa abaixo para desenhar os limites da sua cerca ou use o botão azul para encontrar com o GPS.
      </p>

      {/* Map component wrapper */}
      <div style={styles.mapWrapper}>
        <InteractiveMap 
          onPolygonSaved={handlePolygonSaved} 
          initialGeoJSON={property.geometry}
        />
      </div>

      <div style={styles.actionSection}>
        {polygonDrawn ? (
          <button 
            onClick={handleConfirm} 
            className="gov-btn gov-btn-success"
            style={styles.confirmBtn}
          >
            🎯 Confirmar Desenho e Analisar
          </button>
        ) : (
          <div style={styles.helpBox}>
            📌 Desenhe clicando na tela para ligar os pontos da cerca. 
            Ou, se preferir, convide um técnico pelo botão abaixo:
          </div>
        )}

        <button 
          onClick={inviteTechnician}
          className="gov-btn gov-btn-secondary"
          style={styles.whatsappBtn}
        >
          💬 Chamar Técnico no WhatsApp
        </button>

        <button 
          onClick={prevStep} 
          className="gov-btn gov-btn-secondary"
          style={{ marginTop: '5px' }}
        >
          ⬅️ Voltar
        </button>
      </div>
    </div>
  );
};

const styles = {
  mapWrapper: {
    flexGrow: 1,
    minHeight: '320px',
    marginBottom: '15px'
  },
  actionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  helpBox: {
    backgroundColor: '#fff9db',
    border: '1px solid #f59f00',
    color: '#f59f00',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  confirmBtn: {
    fontSize: '16px',
    animation: 'pulse 2s infinite'
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    color: '#ffffff',
    border: 'none'
  }
};

export default Step3Mapping;
