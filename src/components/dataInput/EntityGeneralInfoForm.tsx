// components/dataInput/EntityGeneralInfoForm.tsx
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { AnnualData, TipologiaEnte } from '../../types';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Card } from '../shared/Card';
import { TEXTS_UI, ALL_TIPOLOGIE_ENTE } from '../../constants';

const booleanOptions = [
  { value: 'true', label: TEXTS_UI.trueText },
  { value: 'false', label: TEXTS_UI.falseText },
];

export const EntityGeneralInfoForm: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { annualData } = state.fundData;
  const { validationErrors } = state;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean | undefined | TipologiaEnte = value;

    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    } else if (name === 'tipologiaEnte') {
      processedValue = value as TipologiaEnte;
      if (value !== TipologiaEnte.Altro) {
        dispatch({ type: 'UPDATE_ANNUAL_DATA', payload: { altroTipologiaEnte: '' } as Partial<AnnualData> });
      }
    } else if (['isEnteDissestato',
               'isEnteStrutturalmenteDeficitario',
               'isEnteRiequilibrioFinanziario',
               'hasDirigenza'].includes(name)) {
      processedValue = value === 'true' ? true : (value === 'false' ? false : undefined);
      if (value === "") processedValue = undefined;
    }
    
    dispatch({ type: 'UPDATE_ANNUAL_DATA', payload: { [name]: processedValue } as Partial<AnnualData> });
  };

  return (
    <Card title="Informazioni Generali Ente e Anno di Riferimento" className="mb-8"> {/* Increased mb */}
       <Input
          label="Anno di Riferimento per la Costituzione del Fondo"
          type="number"
          id="annoRiferimento"
          name="annoRiferimento"
          value={annualData.annoRiferimento}
          onChange={(e) => dispatch({ type: 'SET_CURRENT_YEAR', payload: parseInt(e.target.value) || new Date().getFullYear() })}
          min="2000"
          max="2099"
          containerClassName="mb-6" // Aggiunge spazio sotto
          aria-required="true"
        />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0"> {/* Reduced gap-y */}
        <Input
          label="Denominazione Ente"
          type="text"
          id="denominazioneEnte"
          name="denominazioneEnte"
          value={annualData.denominazioneEnte ?? ''}
          onChange={handleChange}
          placeholder="Es. Comune di..."
          containerClassName="md:col-span-2 mb-3"
          aria-required="true"
          error={validationErrors['fundData.annualData.denominazioneEnte']}
        />
        <Select
          label="Tipologia Ente"
          id="tipologiaEnte"
          name="tipologiaEnte"
          options={ALL_TIPOLOGIE_ENTE}
          value={annualData.tipologiaEnte ?? ''}
          onChange={handleChange}
          placeholder="Seleziona tipologia..."
          aria-required="true"
          containerClassName="mb-3"
          error={validationErrors['fundData.annualData.tipologiaEnte']}
        />
        {annualData.tipologiaEnte === TipologiaEnte.Altro && (
          <Input
            label="Specifica Altra Tipologia Ente"
            type="text"
            id="altroTipologiaEnte"
            name="altroTipologiaEnte"
            value={annualData.altroTipologiaEnte ?? ''}
            onChange={handleChange}
            placeholder="Indicare la tipologia"
            aria-required={annualData.tipologiaEnte === TipologiaEnte.Altro}
            containerClassName="mb-3"
            error={validationErrors['fundData.annualData.altroTipologiaEnte']}
          />
        )}
         <Input
          label="Numero Abitanti al 31.12 Anno Precedente"
          type="number"
          id="numeroAbitanti"
          name="numeroAbitanti"
          value={annualData.numeroAbitanti ?? ''}
          onChange={handleChange}
          placeholder="Es. 15000"
          step="1"
          min="0"
          aria-required="true"
          containerClassName="mb-3"
          error={validationErrors['fundData.annualData.numeroAbitanti']}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-x-6 gap-y-0"> {/* Reduced gap-y */}
         <Select
          label="Ente in dissesto finanziario (art. 244 TUEL)?"
          id="isEnteDissestato"
          name="isEnteDissestato"
          options={booleanOptions}
          value={annualData.isEnteDissestato === undefined ? '' : String(annualData.isEnteDissestato)}
          onChange={handleChange}
          placeholder="Seleziona..."
          aria-required="true"
        />
         <Select
          label="Ente strutturalmente deficitario (art. 242 TUEL)?"
          id="isEnteStrutturalmenteDeficitario"
          name="isEnteStrutturalmenteDeficitario"
          options={booleanOptions}
          value={annualData.isEnteStrutturalmenteDeficitario === undefined ? '' : String(annualData.isEnteStrutturalmenteDeficitario)}
          onChange={handleChange}
          placeholder="Seleziona..."
          aria-required="true"
        />
        <Select
          label="Ente in piano di riequilibrio finanziario pluriennale (art. 243-bis TUEL)?"
          id="isEnteRiequilibrioFinanziario"
          name="isEnteRiequilibrioFinanziario"
          options={booleanOptions}
          value={annualData.isEnteRiequilibrioFinanziario === undefined ? '' : String(annualData.isEnteRiequilibrioFinanziario)}
          onChange={handleChange}
          placeholder="Seleziona..."
          aria-required="true"
        />
        <Select
          label="È un ente con personale dirigente?"
          id="hasDirigenza"
          name="hasDirigenza"
          options={booleanOptions}
          value={annualData.hasDirigenza === undefined ? '' : String(annualData.hasDirigenza)}
          onChange={handleChange}
          placeholder="Seleziona..."
          aria-required="true"
          containerClassName="mb-3"
          error={validationErrors['fundData.annualData.hasDirigenza']}
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
          onChange={handleChange}
          placeholder="Es. 20000.00"
          step="0.01"
          containerClassName="mb-3"
          inputInfo="Inserire l'importo stanziato per il lavoro straordinario per l'anno di riferimento."
        />
      </div>
    </Card>
  );
};