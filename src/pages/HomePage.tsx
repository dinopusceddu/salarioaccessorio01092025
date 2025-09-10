// src/pages/HomePage.tsx
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '../components/shared/Button';
import { TEXTS_UI } from '../constants';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { FundAllocationChart } from '../components/dashboard/FundAllocationChart';
import { ContractedResourcesChart } from '../components/dashboard/ContractedResourcesChart';
import { ComplianceStatusWidget } from '../components/dashboard/ComplianceStatusWidget';
import { HomePageSkeleton } from '../components/dashboard/HomePageSkeleton';
import { Alert } from '../components/shared/Alert';
import { EmptyState } from '../components/shared/EmptyState';

export const HomePage: React.FC = () => {
  const { state, dispatch, performFundCalculation } = useAppContext();
  const { calculatedFund, complianceChecks, fundData, isLoading, error } = state;
  const { denominazioneEnte, annoRiferimento } = fundData.annualData;

  const isDataAvailable = !!calculatedFund;
  const pageTitle = `Riepilogo fondo - ${denominazioneEnte || 'Ente non specificato'} per l'anno ${annoRiferimento}`;

  const renderContent = () => {
    if (isLoading) {
      return <HomePageSkeleton />;
    }

    if (!isDataAvailable) {
      return (
        <EmptyState
          title="Nessun dato calcolato"
          message="Per visualizzare la dashboard, vai alla pagina 'Dati Costituzione Fondo', inserisci i dati richiesti e clicca su 'Salva Dati e Calcola Fondo'."
          actionText="Vai all'inserimento dati"
          onAction={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'dataEntry' })}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-8">
        <DashboardSummary
          calculatedFund={calculatedFund}
          historicalData={fundData.historicalData}
          annoRiferimento={fundData.annualData.annoRiferimento}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FundAllocationChart />
          <ContractedResourcesChart />
        </div>
        <ComplianceStatusWidget complianceChecks={complianceChecks} />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#f3e7e8] pb-4">
        <div>
          <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">
            {pageTitle}
          </h2>
          <p className="text-[#5f5252] mt-1">
            Visione d'insieme dei dati calcolati e dello stato di conformità del fondo.
          </p>
        </div>
        <Button
          onClick={performFundCalculation}
          isLoading={isLoading}
          disabled={isLoading}
          variant="primary"
          size="md"
        >
          {isLoading ? TEXTS_UI.calculating : 'Aggiorna Calcoli'}
        </Button>
      </div>

      {error && !isLoading && (
        <Alert type="error" title="Errore durante l'ultimo calcolo" message={error} />
      )}

      {renderContent()}
    </div>
  );
};
