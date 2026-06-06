import React, { useEffect, useRef, useState } from 'react';
// Note: Leaflet and React-Leaflet must be installed:
// npm install leaflet react-leaflet @geoman-io/leaflet-geoman-free

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// Fix Leaflet marker icon issue in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InteractiveMap = ({ onPolygonSaved, initialGeoJSON }) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [drawingMode, setDrawingMode] = useState(null); // 'property' or 'app'

  // Watch offline status
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize leaflet map
    const map = L.map(mapRef.current, {
      center: [-15.7938, -47.8828], // Center of Brazil (Brasilia)
      zoom: 4,
      zoomControl: false // We will add a custom large zoom control for accessibility
    });

    setMapInstance(map);

    // 1. Setup Base Layers
    // Online tile source
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    // Offline cached tile source (using service worker caching mechanism)
    const offlineLayer = L.tileLayer('/tiles-cache/{z}/{x}/{y}.png', {
      maxZoom: 18,
      fallbackToUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap (Local Cache)'
    });

    if (isOffline) {
      offlineLayer.addTo(map);
    } else {
      osmLayer.addTo(map);
    }

    // 2. Add WMS Layers (FBDS Hidrografia & MapBiomas)
    // FBDS Hydrography WMS (example URL structure)
    const fbdsHydro = L.tileLayer.wms('http://geo.fbds.org.br/wms', {
      layers: 'hidrografia_app',
      format: 'image/png',
      transparent: true,
      attribution: 'Fundação Brasileira para o Desenvolvimento Sustentável'
    });

    // MapBiomas Land Cover WMS (example URL structure)
    const mapBiomas = L.tileLayer.wms('https://geoserver.mapbiomas.org/wms', {
      layers: 'cobertura_terra_transicao',
      format: 'image/png',
      transparent: true,
      attribution: 'MapBiomas'
    });

    // Layer control for accessibility
    const baseMaps = {
      "Mapa Padrão": osmLayer,
      "Mapa Offline": offlineLayer
    };

    const overlayMaps = {
      "Rios e APP (FBDS)": fbdsHydro,
      "Uso da Terra (MapBiomas)": mapBiomas
    };
    
    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 3. Configure Leaflet Geoman (Drawing plugin with simplified buttons for Seu Raimundo)
    map.pm.setLang('pt_br');
    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawPolygon: true,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawCircleMarker: false,
      editMode: true,
      dragMode: true,
      cutPolygon: true,
      removalMode: true,
    });

    // Import initial polygon if it exists
    if (initialGeoJSON) {
      const geoLayer = L.geoJSON(initialGeoJSON);
      geoLayer.addTo(map);
      map.fitBounds(geoLayer.getBounds());
    }

    // Capture drawn shapes and trigger validation
    map.on('pm:create', (e) => {
      const layer = e.layer;
      const geojson = layer.toGeoJSON();

      if (onPolygonSaved) {
        onPolygonSaved(geojson);
      }

      // Add click listener to show description
      layer.on('click', () => {
        layer.bindPopup("<b>Área marcada!</b><br>Você pode editar arrastando os pontos azuis.").openPopup();
      });
    });

    // Get current GPS position of Seu Raimundo's phone
    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', (e) => {
      const radius = e.accuracy;
      L.marker(e.latlng)
        .addTo(map)
        .bindPopup(`Você está a ${Math.round(radius)} metros daqui.`)
        .openPopup();
      L.circle(e.latlng, radius).addTo(map);
    });

    map.on('locationerror', () => {
      console.warn("GPS Location not allowed or failed. Defaulting to Brasilia.");
    });

    return () => {
      map.remove();
    };
  }, [initialGeoJSON]);

  // Large accessibility buttons for Seu Raimundo
  const triggerDrawPolygon = () => {
    if (!mapInstance) return;
    setDrawingMode('property');
    mapInstance.pm.enableDraw('Polygon', {
      snappingOption: true,
      templineStyle: { color: '#006600' },
      hintlineStyle: { color: '#006600', dashArray: [5, 5] },
    });
  };

  const getGPSCoords = () => {
    if (!mapInstance) return;
    mapInstance.locate({ setView: true, maxZoom: 17 });
  };

  return (
    <div style={styles.container}>
      {isOffline && (
        <div style={styles.offlineAlert}>
          ⚠️ <strong>Modo Offline Ativo:</strong> Mapas baixados no celular serão usados. As marcações funcionam normalmente sem internet!
        </div>
      )}
      
      {/* Visual map container */}
      <div ref={mapRef} style={styles.map} id="leaflet-car-map" />

      {/* Simplified controls overlay specifically built for rural user accessibility */}
      <div style={styles.controlsPanel}>
        <h4 style={styles.panelTitle}>Ferramentas do Sítio</h4>
        <p style={styles.panelText}>Clique nos botões grandes abaixo para marcar sua terra:</p>
        
        <button 
          onClick={getGPSCoords}
          style={{ ...styles.actionBtn, backgroundColor: '#0033c6' }}
        >
          📍 Encontrar Meu Sítio (GPS)
        </button>

        <button 
          onClick={triggerDrawPolygon}
          style={{ ...styles.actionBtn, backgroundColor: '#138013' }}
        >
          ✏️ Desenhar Limite da Terra
        </button>

        {drawingMode && (
          <div style={styles.statusHelper}>
            🟢 Clique no mapa para criar as pontas (vértices) da sua terra. Ao terminar, clique na primeira ponta criada.
          </div>
        )}
      </div>
    </div>
  );
};

// gov.br style colors and design guidelines
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '500px',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontFamily: '"Rawline", "Inter", sans-serif'
  },
  map: {
    width: '100%',
    height: '100%',
    zIndex: 1
  },
  offlineAlert: {
    position: 'absolute',
    top: '10px',
    left: '50px',
    right: '10px',
    backgroundColor: '#FFF2CC',
    border: '1px solid '#F1C232',
    color: '#7F6000',
    padding: '10px 15px',
    borderRadius: '4px',
    zIndex: 1000,
    fontSize: '14px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  controlsPanel: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '15px',
    borderRadius: '8px',
    zIndex: 1000,
    width: '280px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    borderLeft: '4px solid #138013'
  },
  panelTitle: {
    margin: '0 0 5px 0',
    color: '#138013',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  panelText: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    color: '#555'
  },
  actionBtn: {
    display: 'block',
    width: '100%',
    color: '#fff',
    border: 'none',
    padding: '12px 10px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '8px',
    textAlign: 'left',
    transition: 'transform 0.1s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
  },
  statusHelper: {
    fontSize: '11px',
    color: '#006600',
    marginTop: '10px',
    backgroundColor: '#E8F5E9',
    padding: '8px',
    borderRadius: '4px',
    lineHeight: '1.4'
  }
};

export default InteractiveMap;
