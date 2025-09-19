import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService, Entity } from '../services/database';
import { INITIAL_ANNUAL_DATA, INITIAL_HISTORICAL_DATA } from '../constants';

interface DashboardPageProps {
  onEntityYearSelected: (entityId: string, year: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onEntityYearSelected }) => {
  const { user, profile, isAdmin } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityYears, setEntityYears] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewEntityForm, setShowNewEntityForm] = useState(false);
  const [showNewYearForm, setShowNewYearForm] = useState<string | null>(null);
  const [newEntityData, setNewEntityData] = useState({
    name: '',
    tipologia: 'comune',
    altroTipologia: '',
    numeroAbitanti: 0
  });
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  // Carica entità e relativi anni
  useEffect(() => {
    loadDashboardData();
  }, [user?.id, isAdmin]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log(`📊 Dashboard: Loading data for ${isAdmin() ? 'admin' : 'user'}: ${user.email}`);
      
      // Carica entità
      const entitiesData = await DatabaseService.listEntities();
      console.log('📊 Dashboard: Loaded entities:', entitiesData.length);
      setEntities(entitiesData);

      // Carica anni per ogni entità
      const yearsData: Record<string, number[]> = {};
      for (const entity of entitiesData) {
        try {
          const years = await DatabaseService.getAvailableYears(entity.id);
          yearsData[entity.id] = years;
          console.log(`📊 Dashboard: Entity ${entity.name} has years:`, years);
        } catch (error) {
          console.error(`Error loading years for entity ${entity.id}:`, error);
          yearsData[entity.id] = [];
        }
      }
      setEntityYears(yearsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Errore nel caricamento dei dati. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      console.log('📊 Dashboard: Creating new entity:', newEntityData);
      
      const newEntity = await DatabaseService.createEntity({
        name: newEntityData.name,
        tipologia: newEntityData.tipologia,
        altro_tipologia: newEntityData.altroTipologia || undefined,
        numero_abitanti: newEntityData.numeroAbitanti
      });

      console.log('✅ Dashboard: Entity created:', newEntity);
      setShowNewEntityForm(false);
      setNewEntityData({ name: '', tipologia: 'comune', altroTipologia: '', numeroAbitanti: 0 });
      await loadDashboardData(); // Ricarica i dati
    } catch (error) {
      console.error('Error creating entity:', error);
      setError('Errore nella creazione dell\'entità. Riprova.');
    }
  };

  const handleCreateYear = async (entityId: string) => {
    try {
      console.log(`📊 Dashboard: Creating new year ${newYear} for entity ${entityId}`);
      
      // Crea un entry vuoto per l'anno specificato con struttura completa
      const defaultFundData = {
        historicalData: INITIAL_HISTORICAL_DATA,
        annualData: {
          ...INITIAL_ANNUAL_DATA,
          annoRiferimento: newYear
        },
        fondoAccessorioDipendenteData: {},
        fondoElevateQualificazioniData: {},
        fondoSegretarioComunaleData: {},
        fondoDirigenzaData: {},
        distribuzioneRisorseData: {}
      };

      const success = await DatabaseService.upsertAnnualEntry(entityId, newYear, defaultFundData);
      
      if (success) {
        console.log(`✅ Dashboard: Year ${newYear} created for entity ${entityId}`);
        setShowNewYearForm(null);
        setNewYear(new Date().getFullYear());
        await loadDashboardData(); // Ricarica i dati
      } else {
        throw new Error('Failed to create year entry');
      }
    } catch (error) {
      console.error('Error creating year:', error);
      setError(`Errore nella creazione dell'anno ${newYear}. Riprova.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Salario Accessorio
              </h1>
              <p className="text-gray-600 mt-1">
                Benvenuto/a, {profile?.full_name || user?.email}
                {isAdmin() && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Admin</span>}
              </p>
            </div>
            <button
              onClick={() => setShowNewEntityForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Nuova Entità
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Dismissi
            </button>
          </div>
        )}

        {/* Entità List */}
        <div className="space-y-6">
          {entities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna entità trovata</h3>
              <p className="text-gray-600 mb-4">
                Inizia creando la tua prima amministrazione.
              </p>
              <button
                onClick={() => setShowNewEntityForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Crea Prima Entità
              </button>
            </div>
          ) : (
            entities.map((entity) => (
              <div key={entity.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{entity.name}</h2>
                    <p className="text-sm text-gray-600 capitalize">
                      {entity.tipologia} {entity.altro_tipologia && `- ${entity.altro_tipologia}`}
                      {entity.numero_abitanti && entity.numero_abitanti > 0 && ` • ${entity.numero_abitanti.toLocaleString()} abitanti`}
                    </p>
                    {isAdmin() && (
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {entity.id} • Proprietario: {entity.user_id}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNewYearForm(entity.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                  >
                    + Aggiungi Anno
                  </button>
                </div>

                {/* Anni disponibili */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Anni Disponibili:</h3>
                  {entityYears[entity.id]?.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nessun anno configurato</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {entityYears[entity.id]?.sort((a, b) => b - a).map((year) => (
                        <button
                          key={year}
                          onClick={() => onEntityYearSelected(entity.id, year)}
                          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-3 py-2 text-sm font-medium text-blue-700 transition-colors"
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form per nuovo anno */}
                {showNewYearForm === entity.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Aggiungi Nuovo Anno</h4>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        value={newYear}
                        onChange={(e) => setNewYear(parseInt(e.target.value))}
                        min={2020}
                        max={2030}
                        className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <button
                        onClick={() => handleCreateYear(entity.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                      >
                        Crea
                      </button>
                      <button
                        onClick={() => setShowNewYearForm(null)}
                        className="text-gray-500 hover:text-gray-700 px-3 py-1 text-sm"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal per nuova entità */}
        {showNewEntityForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuova Entità</h2>
              
              <form onSubmit={handleCreateEntity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Entità
                  </label>
                  <input
                    type="text"
                    required
                    value={newEntityData.name}
                    onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="es. Comune di Milano"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipologia
                  </label>
                  <select
                    value={newEntityData.tipologia}
                    onChange={(e) => setNewEntityData({ ...newEntityData, tipologia: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="comune">Comune</option>
                    <option value="provincia">Provincia</option>
                    <option value="regione">Regione</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                {newEntityData.tipologia === 'altro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specifica Tipologia
                    </label>
                    <input
                      type="text"
                      value={newEntityData.altroTipologia}
                      onChange={(e) => setNewEntityData({ ...newEntityData, altroTipologia: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="es. ASL, Università, etc."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numero Abitanti (opzionale)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newEntityData.numeroAbitanti}
                    onChange={(e) => setNewEntityData({ ...newEntityData, numeroAbitanti: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewEntityForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Crea Entità
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};