// config/fondoDistribuzioneMapping.ts
// Mapping configuration between Fondo Accessorio Dipendente and Distribuzione Risorse
// This defines which fields in the Fondo should automatically sync to Distribuzione fields

import { FondoAccessorioDipendenteData, DistribuzioneRisorseData } from '../types';

export interface FondoDistribuzioneMap {
  fondoField: keyof FondoAccessorioDipendenteData;
  distribuzioneField: keyof DistribuzioneRisorseData;
  description: string;
}

/**
 * Configuration mapping Fondo Accessorio Dipendente fields to Distribuzione Risorse fields
 * When a Fondo field changes, the corresponding Distribuzione field is automatically updated
 */
export const FONDO_DISTRIBUZIONE_MAPPINGS: FondoDistribuzioneMap[] = [
  {
    fondoField: 'vs_art4c3_art15c1k_art67c3c_recuperoEvasione',
    distribuzioneField: 'p_incentiviContoTerzi',
    description: 'Recupero evasione ICI → Incentivi conto terzi',
  },
  {
    fondoField: 'vs_art67c3g_personaleCaseGioco',
    distribuzioneField: 'p_compensiCaseGioco',
    description: 'Risorse personale case da gioco → Compensi case da gioco',
  },
  {
    fondoField: 'vn_art54_art67c3f_rimborsoSpeseNotifica',
    distribuzioneField: 'p_compensiMessiNotificatori',
    description: 'Quota rimborso spese notifica → Compensi messi notificatori',
  },
  {
    fondoField: 'vn_art15c1k_art67c3c_incentiviTecniciCondoni',
    distribuzioneField: 'p_incentiviCondonoFunzioniTecnichePre2018',
    description: 'Incentivi funzioni tecniche, condoni → Incentivi condono/funzioni tecniche',
  },
  {
    fondoField: 'vn_art18h_art67c3c_incentiviSpeseGiudizioCensimenti',
    distribuzioneField: 'p_compensiAvvocatura',
    description: 'Incentivi spese giudizio, compensi censimento → Compensi avvocatura',
  },
  {
    fondoField: 'vn_l145_art1c1091_incentiviRiscossioneIMUTARI',
    distribuzioneField: 'p_incentiviIMUTARI',
    description: 'Incentivi riscossione IMU/TARI → Incentivi IMU/TARI',
  },
];

/**
 * Round a number to 2 decimal places
 */
export const roundToTwoDecimals = (value: number | undefined): number => {
  if (value === undefined || value === null || isNaN(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
};

/**
 * Get the mapped Distribuzione data based on Fondo data changes
 * Returns the updated Distribuzione fields that should be auto-synced
 */
export const getMappedDistribuzioneUpdates = (
  fondoData: Partial<FondoAccessorioDipendenteData>
): Partial<DistribuzioneRisorseData> => {
  const updates: Partial<DistribuzioneRisorseData> = {};

  FONDO_DISTRIBUZIONE_MAPPINGS.forEach(mapping => {
    const fondoValue = fondoData[mapping.fondoField];
    if (fondoValue !== undefined) {
      // Round to 2 decimals and update corresponding Distribuzione field
      updates[mapping.distribuzioneField] = roundToTwoDecimals(fondoValue);
    }
  });

  return updates;
};

/**
 * Check if Fondo and Distribuzione values are aligned
 * Returns array of mismatches for compliance checking
 */
export const checkFondoDistribuzioneAlignment = (
  fondoData: FondoAccessorioDipendenteData,
  distribuzioneData: DistribuzioneRisorseData
): Array<{
  fondoField: keyof FondoAccessorioDipendenteData;
  distribuzioneField: keyof DistribuzioneRisorseData;
  fondoValue: number;
  distribuzioneValue: number;
  difference: number;
  description: string;
}> => {
  const mismatches: Array<{
    fondoField: keyof FondoAccessorioDipendenteData;
    distribuzioneField: keyof DistribuzioneRisorseData;
    fondoValue: number;
    distribuzioneValue: number;
    difference: number;
    description: string;
  }> = [];

  FONDO_DISTRIBUZIONE_MAPPINGS.forEach(mapping => {
    const fondoValue = roundToTwoDecimals(fondoData[mapping.fondoField] as number);
    const distribuzioneValue = roundToTwoDecimals(distribuzioneData[mapping.distribuzioneField] as number);

    // Check if values differ (with tolerance for floating point)
    if (Math.abs(fondoValue - distribuzioneValue) > 0.01) {
      mismatches.push({
        fondoField: mapping.fondoField,
        distribuzioneField: mapping.distribuzioneField,
        fondoValue,
        distribuzioneValue,
        difference: distribuzioneValue - fondoValue,
        description: mapping.description,
      });
    }
  });

  return mismatches;
};
