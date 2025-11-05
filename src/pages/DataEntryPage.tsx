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
import {
  useAppContext,
  setValidationErrors,
  clearValidationErrors,
} from '../contexts/AppContext';
import { TipologiaEnte } from '../enums';
import { getPrimaryEntityName } from '../utils/formatters';
import { DatabaseService } from '../services/database';

export const DataEntryPage: React.FC = () => {
  const { state, performFundCalculation, dispatch } = useAppContext();
  const { isLoading, fundData, error, validationErrors, selectedEntityId } = state;
  
  const [tipologiaEnte, setTipologiaEnte] = useState<TipologiaEnte | undefined>(undefined);

  // ✅ FIX: Load entity tipologia from database using selectedEntityId
  useEffect(() => {
    const loadEntityTipologia = async () => {
      if (!selectedEntityId) {
        setTipologiaEnte(undefined);
        return;
      }
      
      const entity = await DatabaseService.getEntity(selectedEntityId);
      if (entity?.tipologia) {
        setTipologiaEnte(entity.tipologia as TipologiaEnte);
      }
    };
    
    loadEntityTipologia();
  }, [selectedEntityId]);

  const handleSubmit = async () => {
    // Esempio di uso dei nuovi action creators per una validazione lato client
    const entityName = getPrimaryEntityName(state.fundData.annualData);
    if (!entityName || entityName.trim() === '') {
      const errors = {
        'fundData.annualData.denominazioneEnte':
          "Esempio: La denominazione dell'ente non può essere vuota.",
      };
      // Uso del nuovo action creator per impostare gli errori
      setValidationErrors(dispatch, errors);
      return; // Interrompe l'esecuzione
    }

    // Se la validazione custom passa, pulisci gli errori prima di procedere con il calcolo completo
    clearValidationErrors(dispatch);
    await performFundCalculation();
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const showSimulatoreAndArt23Form =
    tipologiaEnte === TipologiaEnte.COMUNE || tipologiaEnte === TipologiaEnte.PROVINCIA;

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">
        Inserimento Dati per Costituzione Fondo
      </h2>

      {error && <Alert type="error" title="Errore" message={error} />}

      {hasValidationErrors && !error && (
        <Alert
          type="warning"
          title="Attenzione"
          message="Sono presenti errori nei dati inseriti. Correggi i campi evidenziati prima di procedere."
        />
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
          {isLoading ? TEXTS_UI.calculating : 'Salva Dati e Calcola Fondo'}
        </Button>
      </div>
    </div>
  );
};