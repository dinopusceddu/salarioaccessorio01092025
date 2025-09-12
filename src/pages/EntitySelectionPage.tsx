import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Alert } from '../components/shared/Alert';
import { DatabaseService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import type { Entity } from '../services/database';

interface EntitySelectionPageProps {
  onEntitySelected: (entityId: string) => void;
}

export const EntitySelectionPage: React.FC<EntitySelectionPageProps> = ({ onEntitySelected }) => {
  const { profile } = useAuth();
  const { dispatch } = useAppContext();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stato per il form di nuova entità
  const [newEntity, setNewEntity] = useState({
    name: '',
    tipologia: 'Comune',
    altro_tipologia: '',
    numero_abitanti: ''
  });

  // Carica entità esistenti
  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);
      const userEntities = await DatabaseService.listEntities();
      setEntities(userEntities);
    } catch (err) {
      console.error('Error loading entities:', err);
      setError('Errore nel caricamento delle entità');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEntity.name.trim()) {
      setError('Il nome dell\'entità è obbligatorio');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const entityData = {
        name: newEntity.name.trim(),
        tipologia: newEntity.tipologia,
        altro_tipologia: newEntity.altro_tipologia.trim() || undefined,
        numero_abitanti: newEntity.numero_abitanti ? parseInt(newEntity.numero_abitanti) : undefined
      };

      const result = await DatabaseService.createEntity(entityData);
      
      if (result.success && result.entity) {
        // Seleziona automaticamente la nuova entità
        onEntitySelected(result.entity.id);
      } else {
        setError(result.error || 'Errore nella creazione dell\'entità');
      }
    } catch (err) {
      console.error('Error creating entity:', err);
      setError('Errore nella creazione dell\'entità');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewEntity({
      name: '',
      tipologia: 'Comune',
      altro_tipologia: '',
      numero_abitanti: ''
    });
    setShowCreateForm(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#994d51] mx-auto"></div>
          <p className="mt-4 text-[#5f5252]">Caricamento entità...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1b0e0e] mb-2">
          Seleziona Entità
        </h1>
        <p className="text-[#5f5252]">
          Scegli l'entità per cui gestire i dati del fondo accessorio, o creane una nuova
        </p>
        {profile && (
          <p className="text-sm text-[#994d51] mt-2">
            Benvenuto, {profile.full_name || profile.email}
          </p>
        )}
      </div>

      {error && (
        <Alert type="error" title="Errore" message={error} />
      )}

      {/* Entità Esistenti */}
      {entities.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1b0e0e] mb-4">
            Le tue entità
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity) => (
              <div key={entity.id} 
                   className="cursor-pointer"
                   onClick={() => onEntitySelected(entity.id)}>
                <Card className="p-4 hover:shadow-md transition-shadow border border-[#f3e7e8] hover:border-[#994d51]">
                  <h3 className="font-semibold text-[#1b0e0e] mb-2">
                    {entity.name}
                  </h3>
                  <p className="text-sm text-[#5f5252] mb-1">
                    Tipologia: {entity.tipologia}
                    {entity.altro_tipologia && ` - ${entity.altro_tipologia}`}
                  </p>
                  {entity.numero_abitanti && (
                    <p className="text-sm text-[#5f5252] mb-1">
                      Abitanti: {entity.numero_abitanti.toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-[#5f5252] text-right">
                    Creata: {new Date(entity.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-3 text-right">
                    <span className="text-sm text-[#994d51] font-medium">
                      Seleziona →
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Crea Nuova Entità */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#1b0e0e]">
            Crea nuova entità
          </h2>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
            >
              + Nuova Entità
            </Button>
          )}
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateEntity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                  Nome dell'entità *
                </label>
                <Input
                  value={newEntity.name}
                  onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                  placeholder="es. Comune di Roma"
                  required
                  disabled={creating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                  Tipologia
                </label>
                <select
                  value={newEntity.tipologia}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewEntity({ ...newEntity, tipologia: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e2d1d3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#994d51] focus:border-transparent"
                  disabled={creating}
                >
                  <option value="Comune">Comune</option>
                  <option value="Provincia">Provincia</option>
                  <option value="Regione">Regione</option>
                  <option value="ASL">ASL</option>
                  <option value="Ente Parco">Ente Parco</option>
                  <option value="Università">Università</option>
                  <option value="altro">Altro</option>
                </select>
              </div>

              {newEntity.tipologia === 'altro' && (
                <div>
                  <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                    Specifica tipologia
                  </label>
                  <Input
                    value={newEntity.altro_tipologia}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntity({ ...newEntity, altro_tipologia: e.target.value })}
                    placeholder="Specifica la tipologia"
                    disabled={creating}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                  Numero abitanti
                </label>
                <Input
                  type="number"
                  value={newEntity.numero_abitanti}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntity({ ...newEntity, numero_abitanti: e.target.value })}
                  placeholder="es. 50000"
                  disabled={creating}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={creating}
                disabled={creating || !newEntity.name.trim()}
              >
                {creating ? 'Creazione...' : 'Crea e Seleziona'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetCreateForm}
                disabled={creating}
              >
                Annulla
              </Button>
            </div>
          </form>
        )}

        {!showCreateForm && entities.length === 0 && (
          <p className="text-[#5f5252] text-center py-8">
            Non hai ancora creato nessuna entità. Clicca su "Nuova Entità" per iniziare.
          </p>
        )}
      </Card>
    </div>
  );
};