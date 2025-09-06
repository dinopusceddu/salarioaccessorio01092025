// pages/DataEntryPage.tsx
import React from 'react';
import { Art23EmployeeAndIncrementForm } from '../components/dataInput/Art23EmployeeAndIncrementForm.tsx';
import { AnnualDataForm } from '../components/dataInput/AnnualDataForm.tsx';
import { EntityGeneralInfoForm } from '../components/dataInput/EntityGeneralInfoForm.tsx';
import { HistoricalDataForm } from '../components/dataInput/HistoricalDataForm.tsx';
import { SimulatoreIncrementoForm } from '../components/dataInput/SimulatoreIncrementoForm.tsx';
import { Button } from '../components/shared/Button.tsx';
import { TEXTS_UI } from '../constants.ts';
import { useAppContext } from '../contexts/AppContext.tsx';
import { TipologiaEnte } from '../types.ts';

export const DataEntryPage: React.FC = () => {
  const { state, performFundCalculation } = useAppContext();
  const { isLoading, fundData, error, validationErrors } = state;
  const { tipologiaEnte } = fundData.annualData;
  
  const handleSubmit = async () => {
    await performFundCalculation();
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  // FIX: Corrected enum access from uppercase to title case to align with the Zod schema definition.
  const showSimulatoreAndArt23Form = tipologiaEnte === TipologiaEnte.Comune || tipologiaEnte === TipologiaEnte.Provincia;

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Inserimento Dati per Costituzione Fondo</h2>
      
      {error && (
        <div className="p-4 bg-[#fdd0d2] border border-[#ea2832] text-[#5c1114] rounded-lg" role="alert">
          <strong className="font-bold">Errore: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {hasValidationErrors && !error && (
         <div className="p-4 bg-[#fffbeb] border border-[#fde68a] text-[#92400e] rounded-lg" role="alert">
          <strong className="font-bold">Attenzione: </strong>
          <span className="block sm:inline">Sono presenti errori nei dati inseriti. Correggi i campi evidenziati prima di procedere.</span>
        </div>
      )}


      <EntityGeneralInfoForm /> 
      <HistoricalDataForm />
      {showSimulatoreAndArt23Form && <Art23EmployeeAndIncrementForm />}
      <AnnualDataForm />
      
      {showSimulatoreAndArt23Form && <SimulatoreIncrementoForm />}

      <div className="mt-10 flex justify-end">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? TEXTS_UI.calculating : "Salva Dati e Calcola Fondo"}
        </Button>
      </div>
    </div>
  );
};