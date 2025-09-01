// pages/HomePage.tsx
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '../components/shared/Button';
import { TEXTS_UI } from '../constants';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { FundAllocationChart } from '../components/dashboard/FundAllocationChart';
import { ComplianceStatusWidget } from '../components/dashboard/ComplianceStatusWidget';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export const HomePage: React.FC = () => {
  const { state, dispatch, performFundCalculation } = useAppContext();
  const { calculatedFund, complianceChecks, fundData, isLoading, error } = state;
  const { denominazioneEnte, annoRiferimento } = fundData.annualData;

  const handleRecalculate = () => {
    performFundCalculation();
  };

  const isDataAvailable = !!calculatedFund;

  const pageTitle = `Riepilogo fondo - ${denominazioneEnte || 'Ente non specificato'} per l'anno ${annoRiferimento}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#f3e7e8] pb-4">
        <div>
          <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">{pageTitle}</h2>
          <p className="text-[#5f5252] mt-1">
            Visione d'insieme dei dati calcolati e dello stato di conformità del fondo.
          </p>
        </div>
        <Button onClick={handleRecalculate} isLoading={isLoading} disabled={isLoading} variant="primary" size="md">
          {isLoading ? TEXTS_UI.calculating : "Aggiorna Calcoli"}
        </Button>
      </div>
      
      {error && (
        <div className="p-4 bg-[#fdd0d2] border border-[#ea2832] text-[#5c1114] rounded-lg" role="alert">
          <strong className="font-bold">Errore: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading && !isDataAvailable && (
        <LoadingSpinner text="Calcolo del fondo in corso..." />
      )}
      
      {!isLoading && !isDataAvailable && (
        <div className="text-center py-10 bg-white rounded-lg border border-[#f3e7e8]">
            <h3 className="text-xl font-semibold text-[#1b0e0e]">Nessun dato calcolato</h3>
            <p className="text-[#5f5252] mt-2 mb-4">
                Per visualizzare la dashboard, vai alla pagina "Dati Costituzione Fondo", inserisci i dati e clicca su "Salva Dati e Calcola Fondo".
            </p>
            <Button variant="primary" onClick={() => dispatch({type: 'SET_ACTIVE_TAB', payload: 'dataEntry'})}>
                Vai all'inserimento dati
            </Button>
        </div>
      )}

      {isDataAvailable && (
        <div className="grid grid-cols-1 gap-8">
          <DashboardSummary 
            calculatedFund={calculatedFund} 
            historicalData={fundData.historicalData}
            annoRiferimento={fundData.annualData.annoRiferimento} 
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FundAllocationChart />
            <ComplianceStatusWidget complianceChecks={complianceChecks} />
          </div>
        </div>
      )}
    </div>
  );
};