// src/App.tsx
import React, { Suspense } from 'react';
// FIX: Changed import from '@tanstack/react-query' to a namespace import to resolve potential module export issues with QueryClient.
import * as TanstackQuery from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MainLayout } from './components/layout/MainLayout.tsx';
import { LoadingSpinner } from './components/shared/LoadingSpinner.tsx';
import { AppProvider, useAppContext } from './contexts/AppContext.tsx';
import { ChecklistPage } from './pages/ChecklistPage.tsx';
import { CompliancePage } from './pages/CompliancePage.tsx';
import { DataEntryPage } from './pages/DataEntryPage.tsx';
import { DistribuzioneRisorsePage } from './pages/DistribuzioneRisorsePage.tsx';
import { FondoAccessorioDipendentePage } from './pages/FondoAccessorioDipendentePage.tsx';
import { FondoDirigenzaPage } from './pages/FondoDirigenzaPage.tsx';
import { FondoElevateQualificazioniPage } from './pages/FondoElevateQualificazioniPage.tsx';
import { FondoSegretarioComunalePage } from './pages/FondoSegretarioComunalePage.tsx';
import { FundDetailsPage } from './pages/FundDetailsPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PersonaleServizioPage } from './pages/PersonaleServizioPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { PageModule } from './types.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// FIX: Removed deprecated `suspense: true` option. Suspense is now handled by `useSuspenseQuery`.
const queryClient = new TanstackQuery.QueryClient({
  defaultOptions: {
    queries: {},
  },
});

const allPageModules: PageModule[] = [
  { id: 'benvenuto', name: 'Benvenuto!', component: HomePage },
  { id: 'dataEntry', name: 'Dati Costituzione Fondo', component: DataEntryPage },
  {
    id: 'fondoAccessorioDipendente',
    name: 'Fondo Accessorio Personale',
    component: FondoAccessorioDipendentePage,
  },
  {
    id: 'fondoElevateQualificazioni',
    name: 'Fondo Elevate Qualificazioni',
    component: FondoElevateQualificazioniPage,
  },
  {
    id: 'fondoSegretarioComunale',
    name: 'Risorse Segretario Comunale',
    component: FondoSegretarioComunalePage,
  },
  { id: 'fondoDirigenza', name: 'Fondo Dirigenza', component: FondoDirigenzaPage },
  {
    id: 'personaleServizio',
    name: 'Personale in servizio',
    component: PersonaleServizioPage,
  },
  {
    id: 'distribuzioneRisorse',
    name: 'Distribuzione Risorse',
    component: DistribuzioneRisorsePage,
  },
  {
    id: 'fundDetails',
    name: 'Dettaglio Fondo Calcolato',
    component: FundDetailsPage,
  },
  { id: 'compliance', name: 'Conformità', component: CompliancePage },
  { id: 'checklist', name: 'Check list Interattiva', component: ChecklistPage },
  { id: 'reports', name: 'Report', component: ReportsPage },
];

const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { activeTab, fundData } = state;

  const visibleModules = allPageModules.filter((module) => {
    if (module.id === 'fondoDirigenza' && !fundData.annualData.hasDirigenza) {
      return false;
    }
    if (module.id === 'distribuzioneRisorse' && !fundData.annualData.isDistributionMode) {
      return false;
    }
    return true;
  });

  React.useEffect(() => {
    const activeModuleIsVisible = visibleModules.some(
      (mod) => mod.id === activeTab
    );
    if (!activeModuleIsVisible && activeTab !== 'benvenuto') {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'benvenuto' });
    }
  }, [visibleModules, activeTab, dispatch]);

  const ActiveComponent =
    visibleModules.find((mod) => mod.id === activeTab)?.component || HomePage;

  return (
    <MainLayout modules={visibleModules}>
      <ErrorBoundary resetKey={activeTab}>
          <ActiveComponent />
      </ErrorBoundary>
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner text="Caricamento applicazione..." /></div>}>
        <TanstackQuery.QueryClientProvider client={queryClient}>
          <AppProvider>
            <AppContent />
          </AppProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </TanstackQuery.QueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
