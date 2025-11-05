import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { DatabaseService, Entity } from '../../services/database';
import { Card } from '../shared/Card';

export const SelectedEntityDisplay: React.FC = () => {
  const { state } = useAppContext();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntity = async () => {
      if (!state.selectedEntityId) {
        setEntity(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const entityData = await DatabaseService.getEntity(state.selectedEntityId);
      setEntity(entityData);
      setLoading(false);
    };

    loadEntity();
  }, [state.selectedEntityId]);

  if (loading) {
    return (
      <Card title="Entità e Anno di Riferimento" className="mb-8">
        <div className="text-center py-4 text-[#5f5252]">
          Caricamento...
        </div>
      </Card>
    );
  }

  if (!entity) {
    return (
      <Card title="Entità e Anno di Riferimento" className="mb-8">
        <div className="text-center py-4 text-[#994d51]">
          ⚠️ Nessuna entità selezionata. Torna alla dashboard per selezionare un'entità.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Entità e Anno di Riferimento" className="mb-8">
      <div className="bg-[#fefbfb] border border-[#f3e7e8] rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#5f5252] mb-1">
              Entità Selezionata
            </label>
            <div className="text-lg font-semibold text-[#1b0e0e]">
              {entity.name}
            </div>
            {entity.tipologia && (
              <div className="text-sm text-[#5f5252] mt-1">
                Tipologia: {entity.tipologia}
                {entity.altro_tipologia && ` (${entity.altro_tipologia})`}
              </div>
            )}
            {entity.numero_abitanti && (
              <div className="text-sm text-[#5f5252] mt-1">
                Abitanti: {entity.numero_abitanti.toLocaleString('it-IT')}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#5f5252] mb-1">
              Anno di Riferimento
            </label>
            <div className="text-lg font-semibold text-[#1b0e0e]">
              {state.currentYear}
            </div>
            <div className="text-sm text-[#5f5252] mt-1">
              I dati vengono salvati automaticamente
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#f3e7e8]">
          <p className="text-sm text-[#5f5252]">
            💡 <strong>Nota:</strong> Per cambiare entità o anno, torna alla dashboard usando il pulsante "← Dashboard" in alto.
          </p>
        </div>
      </div>
    </Card>
  );
};
