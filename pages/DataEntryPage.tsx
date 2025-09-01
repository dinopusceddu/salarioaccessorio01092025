// pages/DataEntryPage.tsx
import React from 'react';
import { HistoricalDataForm } from '../components/dataInput/HistoricalDataForm';
import { AnnualDataForm } from '../components/dataInput/AnnualDataForm'; 
import { EntityGeneralInfoForm } from '../components/dataInput/EntityGeneralInfoForm';
import { Art23EmployeeAndIncrementForm } from '../components/dataInput/Art23EmployeeAndIncrementForm';
import { SimulatoreIncrementoForm } from '../components/dataInput/SimulatoreIncrementoForm';
import { Button } from '../components/shared/Button';
import { useAppContext } from '../contexts/AppContext';
import { TEXTS_UI } from '../constants';
import { TipologiaEnte } from '../types';

export const DataEntryPage: React.FC = () => {
  const { state, performFundCalculation } = useAppContext();
  const { isLoading, fundData } = state;
  const { tipologiaEnte } = fundData.annualData;
  
  const handleSubmit = async () => {
    await performFundCalculation();
  };

  const showSimulatoreAndArt23Form = tipologiaEnte === TipologiaEnte.COMUNE || tipologiaEnte === TipologiaEnte.PROVINCIA;

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Inserimento Dati per Costituzione Fondo</h2>
      
      {state.error && (
        <div className="p-4 bg-[#fdd0d2] border border-[#ea2832] text-[#5c1114] rounded-lg" role="alert"> {/* Adjusted error alert style */}
          <strong className="font-bold">Errore: </strong>
          <span className="block sm:inline">{state.error}</span>
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