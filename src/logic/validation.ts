// src/logic/validation.ts
import { FundDataSchema } from '../schemas/fundDataSchemas.ts';
import { FundData, TipologiaEnte } from '../types.ts';
import { ZodIssue } from 'zod';

const getPath = (path: (string | number | symbol)[]): string => {
    return path.map(String).join('.');
};

export const validateFundData = (fundData: FundData): Record<string, string> => {
    
    // Create a contextual schema for validation
    const refinedSchema = FundDataSchema.refine(data => {
        const isSimulatoreApplicable = data.annualData.tipologiaEnte === TipologiaEnte.Comune || data.annualData.tipologiaEnte === TipologiaEnte.Provincia;
        if (isSimulatoreApplicable) {
            return data.historicalData.fondoPersonaleNonDirEQ2018_Art23 !== undefined;
        }
        return true;
    }, {
        message: "Campo obbligatorio per Comuni e Province.",
        path: ["historicalData", "fondoPersonaleNonDirEQ2018_Art23"],
    }).refine(data => data.annualData.denominazioneEnte && data.annualData.denominazioneEnte.length > 0, {
        message: "La denominazione dell'ente è obbligatoria.",
        path: ["annualData", "denominazioneEnte"],
    }).refine(data => data.annualData.numeroAbitanti !== undefined, {
        message: "Il numero di abitanti è obbligatorio.",
        path: ["annualData", "numeroAbitanti"],
    }).refine(data => data.annualData.hasDirigenza !== undefined, {
        message: "Specificare se l'ente ha personale dirigente.",
        path: ["annualData", "hasDirigenza"],
    }).refine(data => data.annualData.tipologiaEnte !== undefined, {
        message: "La tipologia di ente è obbligatoria.",
        path: ["annualData", "tipologiaEnte"],
    });

    const result = refinedSchema.safeParse(fundData);
    
    if (result.success) {
        return {};
    } else {
        return result.error.issues.reduce((acc: Record<string, string>, issue: ZodIssue) => {
            const pathKey = getPath(issue.path);
            if(pathKey) { // Ensure path is not empty
                acc[pathKey] = issue.message;
            }
            return acc;
        }, {});
    }
};
