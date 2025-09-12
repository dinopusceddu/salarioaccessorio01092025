// src/utils/formatters.ts
import { TEXTS_UI } from '../constants';
import { AnnualData, TipologiaEnte } from '../types';

export const formatCurrency = (value?: number, notApplicableText = TEXTS_UI.notApplicable): string => {
  if (value === undefined || value === null || isNaN(value)) return notApplicableText;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value?: number, digits = 2, notApplicableText = TEXTS_UI.notApplicable): string => {
    if (value === undefined || value === null || isNaN(value)) return notApplicableText;
    return value.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export const formatBoolean = (value?: boolean, notApplicableText = TEXTS_UI.notApplicable): string => {
    if (value === undefined || value === null) return notApplicableText;
    return value ? TEXTS_UI.trueText : TEXTS_UI.falseText;
};

// FIX: Added notApplicableText parameter to handle undefined values correctly.
export const formatPercentage = (value?: number, notApplicableText = TEXTS_UI.notApplicable): string => {
  if (value === undefined || value === null || isNaN(value)) return notApplicableText;
  return `${formatNumber(value)}%`;
};

export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Entity consumption utilities - handles both new entita[] array and legacy fields
export const getPrimaryEntityName = (annualData: AnnualData): string | undefined => {
    // Use first entity from entita[] array if available
    if (annualData.entita && annualData.entita.length > 0) {
        return annualData.entita[0].nome;
    }
    // Fallback to legacy field
    return annualData.denominazioneEnte;
};

export const getPrimaryEntityTipologia = (annualData: AnnualData): TipologiaEnte | undefined => {
    // Use first entity from entita[] array if available
    if (annualData.entita && annualData.entita.length > 0) {
        return annualData.entita[0].tipologia;
    }
    // Fallback to legacy field
    return annualData.tipologiaEnte;
};

export const getPrimaryEntityNumeroAbitanti = (annualData: AnnualData): number | undefined => {
    // Use first entity from entita[] array if available
    if (annualData.entita && annualData.entita.length > 0) {
        return annualData.entita[0].numeroAbitanti;
    }
    // Fallback to legacy field
    return annualData.numeroAbitanti;
};

export const getPrimaryEntityAltroTipologia = (annualData: AnnualData): string | undefined => {
    // Use first entity from entita[] array if available
    if (annualData.entita && annualData.entita.length > 0) {
        return annualData.entita[0].altroTipologia;
    }
    // Fallback to legacy field
    return annualData.altroTipologiaEnte;
};

// Convenience function to get all primary entity data at once
export const getPrimaryEntityData = (annualData: AnnualData) => {
    return {
        nome: getPrimaryEntityName(annualData),
        tipologia: getPrimaryEntityTipologia(annualData),
        numeroAbitanti: getPrimaryEntityNumeroAbitanti(annualData),
        altroTipologia: getPrimaryEntityAltroTipologia(annualData),
    };
};
