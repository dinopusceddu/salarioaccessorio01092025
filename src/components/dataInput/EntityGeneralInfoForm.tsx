// components/dataInput/EntityGeneralInfoForm.tsx
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { AnnualData } from '../../types';
import { TipologiaEnte } from '../../enums';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Card } from '../shared/Card';
import { TEXTS_UI, ALL_TIPOLOGIE_ENTE } from '../../constants';
import { Checkbox } from '../shared/Checkbox';
import { MultipleEntitaForm } from './MultipleEntitaForm';

const booleanOptions = [
  { value: 'true', label: TEXTS_UI.trueText },
  { value: 'false', label: TEXTS_UI.falseText },
];

export const EntityGeneralInfoForm: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { annualData } = state.fundData;
  const { validationErrors } = state;

  const handleGenericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean | undefined = value;

    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    } else if (['isEnteDissestato',
               'isEnteStrutturalmenteDeficitario',
               'isEnteRiequilibrioFinanziario',
               'hasDirigenza',
               'isDistributionMode'
               ].includes(name)) {
      processedValue = (e.target as HTMLInputElement).type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value === 'true' ? true : (value === 'false' ? false : undefined);
      if (value === "") processedValue = undefined;
    }
    
    dispatch({ type: 'UPDATE_ANNUAL_DATA', payload: { [name]: processedValue } as Partial<AnnualData> });
  };

  const handleTipologiaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTipologia = e.target.value as TipologiaEnte;
      const isNumeroAbitantiRequired = newTipologia === TipologiaEnte.COMUNE || newTipologia === TipologiaEnte.PROVINCIA;

      const payload: Partial<AnnualData> = { tipologiaEnte: newTipologia };

      if (!isNumeroAbitantiRequired) {
          payload.numeroAbitanti = undefined;
      }
      if (newTipologia !== TipologiaEnte.ALTRO) {
          payload.altroTipologiaEnte = '';
      }
      
      dispatch({ type: 'UPDATE_ANNUAL_DATA', payload });
  };


  const isNumeroAbitantiRequired = annualData.tipologiaEnte === TipologiaEnte.COMUNE || annualData.tipologiaEnte === TipologiaEnte.PROVINCIA;
  const numeroAbitantiWarning = isNumeroAbitantiRequired && (!annualData.numeroAbitanti || annualData.numeroAbitanti <= 0) 
      ? "Campo non bloccante ma consigliato per il calcolo corretto del simulatore e dei limiti di spesa." 
      : undefined;

  return (
    <div className="space-y-8">
      <Card title="Anno di Riferimento" className="mb-8">
        <Input
          label="Anno di Riferimento per la Costituzione del Fondo"
          type="number"
          id="annoRiferimento"
          name="annoRiferimento"
          value={annualData.annoRiferimento}
          onChange={(e) => dispatch({ type: 'SET_CURRENT_YEAR', payload: parseInt(e.target.value) || new Date().getFullYear() })}
          min="2000"
          max="2099"
          containerClassName="mb-6"
          aria-required="true"
        />
      </Card>

      {/* Nuovo componente per multiple entità */}
      <MultipleEntitaForm />

      {/* Fallback compatibility - mostrato solo se non ci sono entità nel nuovo formato */}
      {annualData.entita.length === 0 && annualData.denominazioneEnte && (
        <Card title="Migrazione Dati Esistenti" className="mb-8 border-amber-200 bg-amber-50">
          <div className="text-amber-800 text-sm mb-4">
            ⚠️ <strong>Dati in formato precedente rilevati.</strong> Aggiungi un'entità sopra per utilizzare il nuovo sistema a entità multiple.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4 bg-white rounded border">
            <Input
              label="Denominazione Ente (Legacy)"
              type="text"
              id="denominazioneEnte"
              name="denominazioneEnte"
              value={annualData.denominazioneEnte ?? ''}
              onChange={handleGenericChange}
              placeholder="Es. Comune di..."
              containerClassName="md:col-span-2"
              disabled
            />
            <Select
              label="Tipologia Ente (Legacy)"
              id="tipologiaEnte"
              name="tipologiaEnte"
              options={ALL_TIPOLOGIE_ENTE}
              value={annualData.tipologiaEnte ?? ''}
              onChange={handleTipologiaChange}
              placeholder="Seleziona tipologia..."
              disabled
            />
            <Input
              label="Numero Abitanti (Legacy)"
              type="number"
              value={annualData.numeroAbitanti ?? ''}
              placeholder="Es. 15000"
              disabled
            />
          </div>
        </Card>
      )}

      <Card title="Configurazioni Ente" className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-x-6 gap-y-4">
         <Select
          label="Ente in dissesto finanziario (art. 244 TUEL)?"
          id="isEnteDissestato"
          name="isEnteDissestato"
          options={booleanOptions}
          value={annualData.isEnteDissestato === undefined ? '' : String(annualData.isEnteDissestato)}
          onChange={handleGenericChange}
          placeholder="Seleziona..."
        />
         <Select
          label="Ente strutturalmente deficitario (art. 242 TUEL)?"
          id="isEnteStrutturalmenteDeficitario"
          name="isEnteStrutturalmenteDeficitario"
          options={booleanOptions}
          value={annualData.isEnteStrutturalmenteDeficitario === undefined ? '' : String(annualData.isEnteStrutturalmenteDeficitario)}
          onChange={handleGenericChange}
          placeholder="Seleziona..."
        />
        <Select
          label="Ente in piano di riequilibrio finanziario pluriennale (art. 243-bis TUEL)?"
          id="isEnteRiequilibrioFinanziario"
          name="isEnteRiequilibrioFinanziario"
          options={booleanOptions}
          value={annualData.isEnteRiequilibrioFinanziario === undefined ? '' : String(annualData.isEnteRiequilibrioFinanziario)}
          onChange={handleGenericChange}
          placeholder="Seleziona..."
        />
        <Select
          label="È un ente con personale dirigente?"
          id="hasDirigenza"
          name="hasDirigenza"
          options={booleanOptions}
          value={annualData.hasDirigenza === undefined ? '' : String(annualData.hasDirigenza)}
          onChange={handleGenericChange}
          placeholder="Seleziona..."
          containerClassName="mb-3"
        />
        <Checkbox
            id="isDistributionMode"
            name="isDistributionMode"
            label="Abilita modalità Distribuzione Risorse?"
            checked={!!annualData.isDistributionMode}
            onChange={handleGenericChange}
            containerClassName="mt-4"
        />
      </div>

      <hr className="my-6 border-t border-[#d1c0c1]" />

      <h4 className="text-base font-semibold text-[#1b0e0e] mb-1">Dati Specifici Anno di Riferimento</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
        <Input
          label="Fondo per il Lavoro Straordinario (€)"
          type="number"
          id="fondoLavoroStraordinario"
          name="fondoLavoroStraordinario"
          value={annualData.fondoLavoroStraordinario ?? ''}
          onChange={handleGenericChange}
          placeholder="0.00"
          step="0.01"
          containerClassName="mb-3"
          inputInfo="Inserire l'importo stanziato per il lavoro straordinario (può essere zero)."
          aria-required="true"
          error={validationErrors['fundData.annualData.fondoLavoroStraordinario']}
        />
      </div>
      </Card>
    </div>
  );
};
