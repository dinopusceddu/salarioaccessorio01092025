// pages/DataEntryPage.tsx
import React, { useState, useEffect } from 'react';

import { Art23EmployeeAndIncrementForm } from '../components/dataInput/Art23EmployeeAndIncrementForm';
import { AnnualDataForm } from '../components/dataInput/AnnualDataForm';
import { EntityGeneralInfoForm } from '../components/dataInput/EntityGeneralInfoForm';
import { HistoricalDataForm } from '../components/dataInput/HistoricalDataForm';
import { SimulatoreIncrementoForm } from '../components/dataInput/SimulatoreIncrementoForm';
import { Alert } from '../components/shared/Alert';
import { Button } from '../components/shared/Button';
import { TEXTS_UI } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { TipologiaEnte } from '../enums';
import { DatabaseService, normalizeTipologia } from '../services/database';

export const DataEntryPage: React.FC = () => {
  const { state, performFundCalculation } = useAppContext();
  const { isLoading, error, selectedEntityId } = state;
  
  const [tipologiaEnte, setTipologiaEnte] = useState<TipologiaEnte | undefined>(undefined);

  // Load entity tipologia from database using selectedEntityId
  useEffect(() => {
    const loadEntityTipologia = async () => {
      if (!selectedEntityId) {
        setTipologiaEnte(undefined);
        return;
      }
      
      const entity = await DatabaseService.getEntity(selectedEntityId);
      console.log('🔍 DataEntryPage: Loaded entity:', entity);
      if (entity?.tipologia) {
        const normalizedTipologia = normalizeTipologia(entity.tipologia);
        console.log('📝 DataEntryPage: Setting tipologia:', { original: entity.tipologia, normalized: normalizedTipologia });
        setTipologiaEnte(normalizedTipologia);
      }
    };
    
    loadEntityTipologia();
  }, [selectedEntityId]);

  const handleSubmit = async () => {
    await performFundCalculation();
  };

  const showSimulatoreAndArt23Form =
    tipologiaEnte === TipologiaEnte.COMUNE || tipologiaEnte === TipologiaEnte.PROVINCIA;
  
  console.log('🎯 DataEntryPage: Show Art23/Simulatore?', { tipologiaEnte, showSimulatoreAndArt23Form, COMUNE: TipologiaEnte.COMUNE });

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">
        Inserimento Dati per Costituzione Fondo
      </h2>

      {error && <Alert type="error" title="Errore" message={error} />}

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
          {isLoading ? TEXTS_UI.calculating : 'Salva Dati e Calcola Fondo'}
        </Button>
      </div>
    </div>
  );
};