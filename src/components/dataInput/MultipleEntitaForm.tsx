// components/dataInput/MultipleEntitaForm.tsx
import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Entita } from '../../types';
import { TipologiaEnte } from '../../enums';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { ALL_TIPOLOGIE_ENTE } from '../../constants';

const generateId = () => `ent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const MultipleEntitaForm: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { annualData } = state.fundData;
  const { entita } = annualData;

  // Stato per il form di nuova entità
  const [nuovaEntita, setNuovaEntita] = useState<Partial<Entita>>({
    nome: '',
    tipologia: undefined,
    altroTipologia: '',
    numeroAbitanti: undefined,
  });

  const handleAddEntita = () => {
    if (!nuovaEntita.nome?.trim()) return;

    const entitaToAdd: Entita = {
      id: generateId(),
      nome: nuovaEntita.nome.trim(),
      tipologia: nuovaEntita.tipologia,
      altroTipologia: nuovaEntita.altroTipologia || undefined,
      numeroAbitanti: nuovaEntita.numeroAbitanti,
    };

    const updatedEntita = [...entita, entitaToAdd];
    dispatch({ 
      type: 'UPDATE_ANNUAL_DATA', 
      payload: { entita: updatedEntita }
    });

    // Reset form
    setNuovaEntita({
      nome: '',
      tipologia: undefined,
      altroTipologia: '',
      numeroAbitanti: undefined,
    });
  };

  const handleRemoveEntita = (id: string) => {
    const updatedEntita = entita.filter(e => e.id !== id);
    dispatch({ 
      type: 'UPDATE_ANNUAL_DATA', 
      payload: { entita: updatedEntita }
    });
  };

  const handleUpdateEntita = (id: string, campo: keyof Entita, valore: any) => {
    const updatedEntita = entita.map(e => 
      e.id === id ? { ...e, [campo]: valore } : e
    );
    dispatch({ 
      type: 'UPDATE_ANNUAL_DATA', 
      payload: { entita: updatedEntita }
    });
  };

  const isNumeroAbitantiRequired = (tipologia?: TipologiaEnte) => 
    tipologia === TipologiaEnte.COMUNE || tipologia === TipologiaEnte.PROVINCIA;

  return (
    <Card title="Denominazioni Enti per l'Anno" className="mb-8">
      {/* Lista entità esistenti */}
      {entita.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-[#1b0e0e] mb-4">
            Entità Associate ({entita.length})
          </h4>
          <div className="space-y-4">
            {entita.map((entitaItem, index) => (
              <div key={entitaItem.id} className="border border-[#f3e7e8] rounded-lg p-4 bg-[#fefbfb]">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-medium text-[#1b0e0e]">
                    Entità #{index + 1}
                  </h5>
                  <Button 
                    onClick={() => handleRemoveEntita(entitaItem.id)}
                    variant="danger" 
                    size="sm"
                  >
                    Rimuovi
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome Entità"
                    type="text"
                    value={entitaItem.nome}
                    onChange={(e) => handleUpdateEntita(entitaItem.id, 'nome', e.target.value)}
                    placeholder="Es. Comune di..."
                  />
                  
                  <Select
                    label="Tipologia Ente"
                    options={ALL_TIPOLOGIE_ENTE}
                    value={entitaItem.tipologia || ''}
                    onChange={(e) => handleUpdateEntita(entitaItem.id, 'tipologia', e.target.value as TipologiaEnte)}
                    placeholder="Seleziona tipologia..."
                  />
                  
                  {entitaItem.tipologia === TipologiaEnte.ALTRO && (
                    <Input
                      label="Specifica Altra Tipologia"
                      type="text"
                      value={entitaItem.altroTipologia || ''}
                      onChange={(e) => handleUpdateEntita(entitaItem.id, 'altroTipologia', e.target.value)}
                      placeholder="Indicare la tipologia"
                    />
                  )}
                  
                  <Input
                    label={`Numero Abitanti${isNumeroAbitantiRequired(entitaItem.tipologia) ? ' *' : ''}`}
                    type="number"
                    value={entitaItem.numeroAbitanti || ''}
                    onChange={(e) => handleUpdateEntita(entitaItem.id, 'numeroAbitanti', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Es. 15000"
                    step="1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form per aggiungere nuova entità */}
      <div className="border-t border-[#f3e7e8] pt-6">
        <h4 className="text-lg font-medium text-[#1b0e0e] mb-4">
          Aggiungi Nuova Entità
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Nome Entità *"
            type="text"
            value={nuovaEntita.nome || ''}
            onChange={(e) => setNuovaEntita({...nuovaEntita, nome: e.target.value})}
            placeholder="Es. Comune di Milano"
          />
          
          <Select
            label="Tipologia Ente"
            options={ALL_TIPOLOGIE_ENTE}
            value={nuovaEntita.tipologia || ''}
            onChange={(e) => setNuovaEntita({
              ...nuovaEntita, 
              tipologia: e.target.value as TipologiaEnte,
              altroTipologia: e.target.value !== TipologiaEnte.ALTRO ? '' : nuovaEntita.altroTipologia
            })}
            placeholder="Seleziona tipologia..."
          />
          
          {nuovaEntita.tipologia === TipologiaEnte.ALTRO && (
            <Input
              label="Specifica Altra Tipologia"
              type="text"
              value={nuovaEntita.altroTipologia || ''}
              onChange={(e) => setNuovaEntita({...nuovaEntita, altroTipologia: e.target.value})}
              placeholder="Indicare la tipologia"
            />
          )}
          
          <Input
            label={`Numero Abitanti${isNumeroAbitantiRequired(nuovaEntita.tipologia) ? ' *' : ''}`}
            type="number"
            value={nuovaEntita.numeroAbitanti || ''}
            onChange={(e) => setNuovaEntita({
              ...nuovaEntita, 
              numeroAbitanti: e.target.value ? Number(e.target.value) : undefined
            })}
            placeholder="Es. 15000"
            step="1"
          />
        </div>
        
        <Button 
          onClick={handleAddEntita}
          disabled={!nuovaEntita.nome?.trim()}
          variant="primary"
          size="sm"
        >
          Aggiungi Entità
        </Button>
      </div>

      {entita.length === 0 && (
        <div className="text-center py-8 text-[#5f5252]">
          <p className="text-lg font-medium mb-2">Nessuna entità associata</p>
          <p className="text-sm">
            Aggiungi almeno un'entità per procedere con il calcolo del fondo
          </p>
        </div>
      )}
    </Card>
  );
};