// logic/validation.ts
import { FundData, TipologiaEnte } from '../types';

export const validateFundData = (fundData: FundData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const { annualData, historicalData } = fundData;

    // EntityGeneralInfoForm validations
    if (!annualData.denominazioneEnte?.trim()) {
        errors.denominazioneEnte = 'La denominazione dell\'ente è obbligatoria.';
    }
    if (!annualData.tipologiaEnte) {
        errors.tipologiaEnte = 'La tipologia di ente è obbligatoria.';
    }
    if (annualData.tipologiaEnte === TipologiaEnte.ALTRO && !annualData.altroTipologiaEnte?.trim()) {
        errors.altroTipologiaEnte = 'Specificare la tipologia di ente.';
    }
    if (annualData.numeroAbitanti === undefined) {
        errors.numeroAbitanti = 'Il numero di abitanti è obbligatorio.';
    } else if (annualData.numeroAbitanti <= 0) {
        errors.numeroAbitanti = 'Il numero di abitanti deve essere positivo.';
    }
    if (annualData.hasDirigenza === undefined) {
        errors.hasDirigenza = 'Specificare se l\'ente ha personale dirigente è obbligatorio.';
    }

    // HistoricalDataForm validations
    if (historicalData.fondoSalarioAccessorioPersonaleNonDirEQ2016 === undefined) {
        errors.fondoSalarioAccessorioPersonaleNonDirEQ2016 = 'Il fondo 2016 è obbligatorio per il calcolo del limite.';
    }
    
    // Art23EmployeeAndIncrementForm validations (if applicable)
    if (annualData.tipologiaEnte === TipologiaEnte.COMUNE || annualData.tipologiaEnte === TipologiaEnte.PROVINCIA) {
        if (historicalData.fondoPersonaleNonDirEQ2018_Art23 === undefined) {
            errors.fondoPersonaleNonDirEQ2018_Art23 = 'Il fondo 2018 è obbligatorio per l\'adeguamento del limite.';
        }
    }

    return errors;
};