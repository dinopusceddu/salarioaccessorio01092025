// src/App.tsx
import React, { Suspense } from 'react';
// FIX: Changed import from '@tanstack/react-query' to a namespace import to resolve potential module export issues with QueryClient.
import * as TanstackQuery from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ChecklistPage } from './pages/ChecklistPage';
import { CompliancePage } from './pages/CompliancePage';
import { DataEntryPage } from './pages/DataEntryPage';
import { DistribuzioneRisorsePage } from './pages/DistribuzioneRisorsePage';
import { FondoAccessorioDipendentePage } from './pages/FondoAccessorioDipendentePage';
import { FondoDirigenzaPage } from './pages/FondoDirigenzaPage';
import { FondoElevateQualificazioniPage } from './pages/FondoElevateQualificazioniPage';
import { FondoSegretarioComunalePage } from './pages/FondoSegretarioComunalePage';
import { FundDetailsPage } from './pages/FundDetailsPage';
import { HomePage } from './pages/HomePage';
import { PersonaleServizioPage } from './pages/PersonaleServizioPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';
import { DashboardPage } from './pages/DashboardPage';
import { PageModule } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

// FIX: Removed deprecated `suspense: true` option. Suspense is now handled by `useSuspenseQuery`.
const queryClient = new TanstackQuery.QueryClient({
  defaultOptions: {
    queries: {},
  },
});

const getPageModules = (isAdmin: boolean): PageModule[] => {
  const baseModules: PageModule[] = [
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

  // Aggiungi la pagina Admin solo per gli amministratori
  if (isAdmin) {
    baseModules.push({ id: 'admin', name: '👤 Amministrazione', component: AdminPage });
  }

  return baseModules;
};

const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { activeTab, fundData, selectedEntityId } = state;
  const { isAdmin, role, profile, loading } = useAuth();

  console.log('🏠 App: Auth state:', { role, isAdminResult: isAdmin(), profile: profile?.email, loading, selectedEntityId });

  const allPageModules = getPageModules(isAdmin());

  const visibleModules = allPageModules.filter((module) => {
    if (module.id === 'fondoDirigenza' && !fundData.annualData.hasDirigenza) {
      return false;
    }
    if (module.id === 'distribuzioneRisorse' && !fundData.annualData.isDistributionMode) {
      return false;
    }
    return true;
  });

  // ✅ FIX: Hook must be called before any conditional returns
  React.useEffect(() => {
    if (!selectedEntityId) return; // Skip if no entity selected
    
    const activeModuleIsVisible = visibleModules.some(
      (mod) => mod.id === activeTab
    );
    if (!activeModuleIsVisible && activeTab !== 'benvenuto') {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'benvenuto' });
    }
  }, [selectedEntityId, visibleModules, activeTab, dispatch]);

  // Nuovo workflow: se non c'è un'entità selezionata, mostra DashboardPage
  if (!selectedEntityId) {
    return (
      <ProtectedRoute>
        <DashboardPage 
          onEntityYearSelected={(entityId, year) => {
            dispatch({ type: 'SET_SELECTED_ENTITY', payload: entityId });
            dispatch({ type: 'SET_CURRENT_YEAR', payload: year });
            dispatch({ type: 'SET_ACTIVE_TAB', payload: 'benvenuto' });
          }}
        />
      </ProtectedRoute>
    );
  }

  const ActiveComponent =
    visibleModules.find((mod) => mod.id === activeTab)?.component || HomePage;

  return (
    <ProtectedRoute>
      <MainLayout modules={visibleModules}>
        <ErrorBoundary resetKey={activeTab}>
            <ActiveComponent />
        </ErrorBoundary>
      </MainLayout>
    </ProtectedRoute>
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
