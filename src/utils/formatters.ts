// src/utils/formatters.ts
import { TEXTS_UI } from '../constants';

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
