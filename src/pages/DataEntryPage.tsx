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
import { TipologiaEnte } from '../enums.ts';
import { Alert } from '../components/shared/Alert.tsx';

export const DataEntryPage: React.FC = () => {
  const { state, performFundCalculation } = useAppContext();
  const { isLoading, fundData, error, validationErrors } = state;
  const { tipologiaEnte } = fundData.annualData;
  
  const handleSubmit = async () => {
    await performFundCalculation();
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const showSimulatoreAndArt23Form = tipologiaEnte === TipologiaEnte.COMUNE || tipologiaEnte === TipologiaEnte.PROVINCIA;

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Inserimento Dati per Costituzione Fondo</h2>
      
      {error && (
         <Alert type="error" title="Errore" message={error} />
      )}

      {hasValidationErrors && !error && (
         <Alert type="warning" title="Attenzione" message="Sono presenti errori nei dati inseriti. Correggi i campi evidenziati prima di procedere." />
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
