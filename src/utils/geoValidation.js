/**
 * Geospatial Validation Utility for CAR (Cadastro Ambiental Rural)
 * Handles overlapping calculations and applies the Brazilian Forest Code (Lei 12.651/2012)
 * rules for small family properties (up to 4 Fiscal Modules).
 */

import * as turf from '@turf/turf';

// Note: Requires turf to be installed:
// npm install @turf/turf

/**
 * Calculates fiscal module limits. 
 * Note: A fiscal module in Brazil varies by municipality (from 5 to 110 hectares).
 * @param {number} areaHa - Area of the property in hectares
 * @param {number} moduleSizeHa - Size of one fiscal module in the municipality (in hectares)
 */
export function getFiscalModulesCount(areaHa, moduleSizeHa = 50) {
  return areaHa / moduleSizeHa;
}

/**
 * Brazilian Forest Code rules for Permanent Preservation Areas (APPs) along watercourses
 * for consolidated rural areas in small properties (Art. 61-A of Law 12.651/2012).
 * Returns the required buffer width in meters.
 * 
 * @param {number} propertyAreaHa 
 * @param {number} moduleSizeHa 
 */
export function getRequiredRiverBuffer(propertyAreaHa, moduleSizeHa = 50) {
  const modules = getFiscalModulesCount(propertyAreaHa, moduleSizeHa);

  if (modules <= 1) {
    return 5;  // 5 meters buffer required for properties up to 1 fiscal module
  } else if (modules <= 2) {
    return 8;  // 8 meters buffer for properties between 1 and 2 fiscal modules
  } else if (modules <= 4) {
    return 15; // 15 meters buffer for properties between 2 and 4 fiscal modules
  } else {
    return 30; // Standard minimum for properties above 4 fiscal modules (rivers up to 10m wide)
  }
}

/**
 * Main validation function that evaluates the property polygon against hydrological networks
 * and maps of forest cover to diagnose APP compliance and Legal Reserve.
 * 
 * @param {Object} propertyGeoJSON - GeoJSON Feature of the property boundary
 * @param {Object} hydrographyGeoJSON - GeoJSON FeatureCollection of rivers/springs
 * @param {Object} forestCoverGeoJSON - GeoJSON FeatureCollection of MapBiomas native vegetation
 * @param {number} moduleSizeHa - Size of 1 fiscal module in the region
 */
export function validatePropertyCAR(propertyGeoJSON, hydrographyGeoJSON, forestCoverGeoJSON, moduleSizeHa = 50) {
  try {
    // 1. Calculate property area
    const areaSqMeters = turf.area(propertyGeoJSON);
    const areaHa = areaSqMeters / 10000;
    const fiscalModules = getFiscalModulesCount(areaHa, moduleSizeHa);
    const isSmallProperty = fiscalModules <= 4;

    // 2. Identify hydrography intersecting with the property
    let intersectingHydro = null;
    try {
      intersectingHydro = turf.intersect(propertyGeoJSON, hydrographyGeoJSON);
    } catch (e) {
      // Handle topology exceptions if any
      intersectingHydro = null;
    }

    // 3. Estimate required Permanent Preservation Area (APP)
    const requiredBufferMeters = getRequiredRiverBuffer(areaHa, moduleSizeHa);
    
    // Generate buffer around the hydrography inside the property to represent the APP
    let appZone = null;
    let appAreaHa = 0;
    let preservedAppAreaHa = 0;
    let degradedAppAreaHa = 0;

    if (intersectingHydro) {
      appZone = turf.buffer(intersectingHydro, requiredBufferMeters / 1000, { units: 'kilometers' });
      // Intersect buffer with property to clip it to boundaries
      appZone = turf.intersect(propertyGeoJSON, appZone);

      if (appZone) {
        appAreaHa = turf.area(appZone) / 10000;

        // Check how much APP is covered by native vegetation (MapBiomas)
        if (forestCoverGeoJSON) {
          const appPreservedZone = turf.intersect(appZone, forestCoverGeoJSON);
          if (appPreservedZone) {
            preservedAppAreaHa = turf.area(appPreservedZone) / 10000;
          }
        }
        degradedAppAreaHa = Math.max(0, appAreaHa - preservedAppAreaHa);
      }
    }

    // 4. Calculate Legal Reserve (Reserva Legal - RL) requirement
    // In Brazil: Amazon Biome = 80% (forest), Cerrado = 35%, Other Biomes = 20%
    // However, Art. 67 states small properties (<= 4 modules) are exempt from restoring RL 
    // beyond the native vegetation existing on Dec 22, 2008.
    const legalReserveRequirementPct = 0.20; // Default (Atlantic Forest, Caatinga, etc.)
    const rawRequiredRlHa = areaHa * legalReserveRequirementPct;
    
    let existingForestHa = 0;
    if (forestCoverGeoJSON) {
      const forestIntersection = turf.intersect(propertyGeoJSON, forestCoverGeoJSON);
      if (forestIntersection) {
        existingForestHa = turf.area(forestIntersection) / 10000;
      }
    }

    // For Seu Raimundo (small property): RL is legal if he registers the existing vegetation,
    // even if it is below 20%. No restoration fine applies.
    const actualRequiredRlHa = isSmallProperty 
      ? Math.min(rawRequiredRlHa, existingForestHa) 
      : rawRequiredRlHa;

    const rlStatus = existingForestHa >= actualRequiredRlHa ? 'COMPLIANT' : 'WARNING';

    // 5. Build friendly warnings and alerts for Seu Raimundo
    const alerts = [];

    if (degradedAppAreaHa > 0) {
      alerts.push({
        type: 'WARNING',
        code: 'APP_DEGRADED',
        title: 'Área de Beira de Rio a Recuperar',
        message: `Foi identificada uma área de preservação de ${degradedAppAreaHa.toFixed(2)} ha sem vegetação nativa nas margens do rio. Pelo Código Florestal Simplificado, você precisará plantar uma faixa de apenas ${requiredBufferMeters} metros ao redor da água.`
      });
    } else if (appAreaHa > 0) {
      alerts.push({
        type: 'SUCCESS',
        code: 'APP_PRESERVED',
        title: 'Parabéns! Suas águas estão protegidas',
        message: `As margens dos seus rios (${appAreaHa.toFixed(2)} ha) estão totalmente cobertas por mata nativa!`
      });
    }

    if (isSmallProperty) {
      alerts.push({
        type: 'INFO',
        code: 'SMALL_PROPERTY_BENEFIT',
        title: 'Benefício de Pequeno Produtor',
        message: `Sua terra tem ${areaHa.toFixed(2)} ha (${fiscalModules.toFixed(1)} Módulos Fiscais). Pela lei, você tem anistia de multas e regras mais fáceis para recompor a vegetação.`
      });
    }

    if (rlStatus === 'WARNING' && !isSmallProperty) {
      alerts.push({
        type: 'DANGER',
        code: 'RL_DEFICIT',
        title: 'Déficit de Reserva Legal',
        message: `Propriedades médias/grandes precisam de no mínimo ${(legalReserveRequirementPct * 100)}% de Reserva Legal. Faltam ${(actualRequiredRlHa - existingForestHa).toFixed(2)} ha para cumprir a meta.`
      });
    }

    return {
      propertyAreaHa: parseFloat(areaHa.toFixed(3)),
      fiscalModules: parseFloat(fiscalModules.toFixed(2)),
      isSmallProperty,
      app: {
        totalHa: parseFloat(appAreaHa.toFixed(3)),
        preservedHa: parseFloat(preservedAppAreaHa.toFixed(3)),
        degradedHa: parseFloat(degradedAppAreaHa.toFixed(3)),
        requiredBufferMeters
      },
      legalReserve: {
        requiredHa: parseFloat(actualRequiredRlHa.toFixed(3)),
        existingHa: parseFloat(existingForestHa.toFixed(3)),
        status: rlStatus
      },
      alerts
    };

  } catch (error) {
    console.error('Error in CAR geospatial validation:', error);
    throw error;
  }
}
