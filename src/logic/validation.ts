// src/logic/validation.ts
import { FundData } from '../types';
import { FundDataSchema } from '../schemas/fundDataSchemas'; 
import { ZodIssue } from 'zod';

const getPath = (path: (string | number | symbol)[]): string => {
    return path.filter(item => typeof item === 'string' || typeof item === 'number').join('.');
};

export const validateFundData = (fundData: FundData): Record<string, string> => {
    
    // Create a contextual schema for validation
    const refinedSchema = FundDataSchema.refine(data => {
        const isSimulatoreApplicable = data.annualData.tipologiaEnte === 'Comune' || data.annualData.tipologiaEnte === 'Provincia';
        if (isSimulatoreApplicable) {
            return data.historicalData.fondoPersonaleNonDirEQ2018_Art23 !== undefined;
        }
        return true;
    }, {
        message: "Campo obbligatorio per Comuni e Province.",
        path: ["historicalData", "fondoPersonaleNonDirEQ2018_Art23"],
    }).refine(data => {
        const PNRR3Applicable = data.annualData.rispettoEquilibrioBilancioPrecedente !== undefined; // Check one PNRR field to see if the form is active
        if (PNRR3Applicable) {
            return data.annualData.fondoStabile2016PNRR !== undefined && data.annualData.incidenzaSalarioAccessorioUltimoRendiconto !== undefined && data.annualData.rispettoDebitoCommercialePrecedente !== undefined && data.annualData.approvazioneRendicontoPrecedente !== undefined;
        }
        return true;
    });

    const result = refinedSchema.safeParse(fundData);
    
    if (result.success) {
        return {};
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue: ZodIssue) => {
        const key = getPath(issue.path);
        if (!errors[key]) {
            errors[key] = issue.message;
        }
    });
    
    return errors;
};
