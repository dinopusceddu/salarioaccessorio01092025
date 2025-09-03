// src/logic/validation.ts
import { FundData } from '../types';
import { FundDataSchema } from '../schemas/fundDataSchemas'; 
import { ZodIssue } from 'zod';

// FIX: Modified getPath to handle PropertyKey[] by filtering out symbols, ensuring type compatibility.
const getPath = (path: (string | number | symbol)[]): string => {
    return path.filter(item => typeof item === 'string' || typeof item === 'number').join('.');
};

export const validateFundData = (fundData: FundData): Record<string, string> => {
    
    const result = FundDataSchema.safeParse(fundData);
    
    if (result.success) {
        return {};
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue: ZodIssue) => {
        const key = getPath(issue.path);
        // Take only the first error for each field to avoid cluttering the UI
        if (!errors[key]) {
            errors[key] = issue.message;
        }
    });

    return errors;
};