// src/HomePage.tsx
import React, { useState } from 'react';
import { useAppContext } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import { DashboardSummary } from './components/dashboard/DashboardSummary';
import { ComplianceStatusWidget } from './components/dashboard/ComplianceStatusWidget';
import { Button } from './components/shared/Button';
import { YearSelector } from './components/shared/YearSelector';
import { useDatabaseSync } from './hooks/useDatabaseSync';
import { TEXTS_UI } from './constants';

export const HomePage: React.FC = () => {
  const { state, performFundCalculation, dispatch } = useAppContext();
  const { calculatedFund, complianceChecks, fundData, isLoading } = state;
  const { role, profile } = useAuth();
  const { saveCurrentData, loadYearData, isSaving, isLoading: isLoadingYear } = useDatabaseSync();
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleRecalculate = () => {
    performFundCalculation();
  };

  const handleSaveData = async () => {
    const result = await saveCurrentData();
    setMessage(result.message);
    setMessageType(result.success ? 'success' : 'error');
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleLoadYearData = async (year: number) => {
    const result = await loadYearData(year);
    setMessage(result.message);
    setMessageType(result.success ? 'success' : 'error');
    if (result.success) {
      dispatch({ type: 'SET_CURRENT_YEAR', payload: year });
    }
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-[#1b0e0e]">Dashboard Principale</h2>
          {profile && (
            <p className="text-sm text-[#994d51]">
              Benvenuto, {profile.full_name || profile.email} 
              {role && <span className="ml-2 px-2 py-1 bg-[#ea2832] text-white rounded-full text-xs font-medium">{role.toUpperCase()}</span>}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleSaveData} 
            isLoading={isSaving} 
            disabled={isSaving || isLoading} 
            variant="secondary"
            size="sm"
          >
            {isSaving ? 'Salvando...' : 'Salva Dati'}
          </Button>
          <Button onClick={handleRecalculate} isLoading={isLoading} disabled={isLoading} variant="primary">
            {isLoading ? TEXTS_UI.calculating : "Aggiorna Calcoli"}
          </Button>
        </div>
      </div>

      {/* Messaggi di feedback */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          messageType === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`} role="alert">
          <strong className="font-bold">
            {messageType === 'success' ? 'Successo: ' : 'Errore: '}
          </strong>
          <span>{message}</span>
        </div>
      )}
      
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg" role="alert">
          <strong className="font-bold">Errore: </strong>
          <span className="block sm:inline">{state.error}</span>
        </div>
      )}

      {/* Caricamento dati anni precedenti */}
      <YearSelector
        currentYear={state.currentYear}
        onYearChange={(year) => dispatch({ type: 'SET_CURRENT_YEAR', payload: year })}
        onLoadYear={handleLoadYearData}
      />

      <DashboardSummary calculatedFund={calculatedFund} annoRiferimento={fundData.annualData.annoRiferimento} />
      <ComplianceStatusWidget complianceChecks={complianceChecks} />
      
      {/* Prossimi passi */}
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">Prossimi Passi</h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>Verificare tutti i dati inseriti nelle sezioni dedicate</li>
            <li>Analizzare i risultati dei controlli di conformità</li>
            <li>Salvare i dati nel database per conservare il lavoro</li>
            <li>Procedere alla generazione dei report formali</li>
            <li>Consultare la documentazione per i riferimenti normativi</li>
        </ul>
      </div>
    </div>
  );
};