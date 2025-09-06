// src/hooks/useNormativeData.ts
import { useSuspenseQuery } from '@tanstack/react-query';
import { NormativeData } from '../types.ts';
import { NormativeDataSchema } from '../schemas/fundDataSchemas.ts';

const fetchNormativeData = async (): Promise<NormativeData> => {
    const response = await fetch('/normativa.json');
    if (!response.ok) {
        throw new Error(`Errore HTTP! status: ${response.status}`);
    }
    const data = await response.json();
    return NormativeDataSchema.parse(data); // Validate data against schema
};

export const useNormativeData = () => {
  // FIX: Replaced `useQuery` with `useSuspenseQuery` to correctly implement suspense.
  const query = useSuspenseQuery<NormativeData, Error>({
    queryKey: ['normativeData'],
    queryFn: fetchNormativeData,
    staleTime: Infinity, // This data is static for the session
    retry: 3,
  });

  return query;
};
