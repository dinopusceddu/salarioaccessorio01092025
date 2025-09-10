// src/logic/validation.ts
import { z, ZodIssue } from 'zod';
import { FundData } from '../types';
import { TipologiaEnteSchema } from '../schemas/fundDataSchemas';

const getPath = (path: (string | number | symbol)[]): string => {
    return path.map(String).join('.');
};

// FIX: Replaced `z.coerce.number` with an explicit `z.preprocess` to handle number coercion
// with custom error messages, as `z.coerce.number({ ... })` was causing a TypeScript error,
// likely due to the Zod version in use.
const numberRequired = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.any().refine(val => val !== undefined, {
    message: "Questo campo è obbligatorio."
  }).pipe(
    z.preprocess(
        (val) => Number(val),
        z.number({ invalid_type_error: "Deve essere un numero valido." })
         .nonnegative({ message: "L'importo non può essere negativo." })
    )
  )
);

// FIX: Replaced `z.coerce.number` with an explicit `z.preprocess` to handle number coercion
// with custom error messages, as `z.coerce.number({ ... })` was causing a TypeScript error,
// likely due to the Zod version in use.
const numberCanBeZero = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.any().refine(val => val !== undefined, {
    message: "Questo campo è obbligatorio (può essere 0)."
  }).pipe(
    z.preprocess(
        (val) => Number(val),
        z.number({ invalid_type_error: "Deve essere un numero valido." })
         .nonnegative({ message: "L'importo non può essere negativo." })
    )
  )
);

// Schema for validation
const ValidationSchema = z.object({
    annualData: z.object({
        // FIX: Removed `&& val !== ''` which caused a TypeScript error because the inferred type `TipologiaEnte | null` can never be an empty string.
        tipologiaEnte: TipologiaEnteSchema.nullable().refine(val => val != null, {
            message: "La tipologia di ente è obbligatoria."
        }),
        fondoLavoroStraordinario: numberCanBeZero,
    }).passthrough(),
    historicalData: z.object({
        fondoSalarioAccessorioPersonaleNonDirEQ2016: numberRequired,
        fondoPersonaleNonDirEQ2018_Art23: numberRequired,
        fondoEQ2018_Art23: numberCanBeZero,
    }).passthrough(),
}).passthrough();

export const validateFundData = (fundData: FundData): Record<string, string> => {
    const result = ValidationSchema.safeParse(fundData);
    
    if (result.success) {
        return {};
    } else {
        return result.error.issues.reduce((acc: Record<string, string>, issue: ZodIssue) => {
            const pathKey = `fundData.${getPath(issue.path)}`;
            if(pathKey) {
                acc[pathKey] = issue.message;
            }
            return acc;
        }, {});
    }
};
