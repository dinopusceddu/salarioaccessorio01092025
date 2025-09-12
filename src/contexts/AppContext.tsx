// contexts/AppContext.tsx
import React, { createContext, Dispatch, useCallback, useContext, useReducer } from 'react';

import {
  INITIAL_ANNUAL_DATA,
  INITIAL_DISTRIBUZIONE_RISORSE_DATA,
  INITIAL_FONDO_ACCESSORIO_DIPENDENTE_DATA,
  INITIAL_FONDO_DIRIGENZA_DATA,
  INITIAL_FONDO_ELEVATE_QUALIFICAZIONI_DATA,
  INITIAL_FONDO_SEGRETARIO_COMUNALE_DATA,
  INITIAL_HISTORICAL_DATA,
  DEFAULT_CURRENT_YEAR,
  DEFAULT_USER,
} from '../constants';
import { DatabaseService } from '../services/database';
import { useAuth } from './AuthContext';
import { useNormativeData } from '../hooks/useNormativeData';
import { runAllComplianceChecks } from '../logic/complianceChecks';
import { calculateFundCompletely } from '../logic/fundCalculations';
import { validateFundData } from '../logic/validation';
import {
  AppAction,
  AppState,
  Art23EmployeeDetail,
  DistribuzioneRisorseData,
  FondoAccessorioDipendenteData,
  FondoDirigenzaData,
  FondoElevateQualificazioniData,
  FondoSegretarioComunaleData,
  PersonaleServizioDettaglio,
  SimulatoreIncrementoInput,
  TipoMaggiorazione,
} from '../types';

const LOCAL_STORAGE_KEY = 'salario-accessorio-app-state';

const defaultInitialState: AppState = {
  currentUser: DEFAULT_USER,
  currentYear: DEFAULT_CURRENT_YEAR,
  selectedEntityId: null,
  fundData: {
    historicalData: INITIAL_HISTORICAL_DATA,
    annualData: INITIAL_ANNUAL_DATA,
    fondoAccessorioDipendenteData: INITIAL_FONDO_ACCESSORIO_DIPENDENTE_DATA,
    fondoElevateQualificazioniData: INITIAL_FONDO_ELEVATE_QUALIFICAZIONI_DATA,
    fondoSegretarioComunaleData: INITIAL_FONDO_SEGRETARIO_COMUNALE_DATA,
    fondoDirigenzaData: INITIAL_FONDO_DIRIGENZA_DATA,
    distribuzioneRisorseData: INITIAL_DISTRIBUZIONE_RISORSE_DATA,
  },
  personaleServizio: {
    dettagli: [],
  },
  calculatedFund: undefined,
  complianceChecks: [],
  isLoading: false,
  isNormativeDataLoading: true,
  normativeData: undefined,
  error: undefined,
  validationErrors: {},
  activeTab: 'benvenuto',
};

const loadInitialState = (): AppState => {
  try {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);

      if (parsedState.fundData?.annualData?.personaleServizioDettagli) {
        if (!parsedState.personaleServizio) {
          parsedState.personaleServizio = { dettagli: [] };
        }
        parsedState.personaleServizio.dettagli =
          parsedState.fundData.annualData.personaleServizioDettagli;
        delete parsedState.fundData.annualData.personaleServizioDettagli;
      }

      const mergedState = {
        ...defaultInitialState,
        ...parsedState,
        fundData: {
          ...defaultInitialState.fundData,
          ...(parsedState.fundData || {}),
          historicalData: {
            ...defaultInitialState.fundData.historicalData,
            ...(parsedState.fundData?.historicalData || {}),
          },
          annualData: {
            ...defaultInitialState.fundData.annualData,
            ...(parsedState.fundData?.annualData || {}),
            // Migrazione per retrocompatibilità: converti denominazioneEnte singola in array entita
            entita: parsedState.fundData?.annualData?.entita || 
              (parsedState.fundData?.annualData?.denominazioneEnte ? 
                [{
                  id: 'migrated-entity',
                  nome: parsedState.fundData.annualData.denominazioneEnte,
                  tipologia: parsedState.fundData?.annualData?.tipologiaEnte,
                  altroTipologia: parsedState.fundData?.annualData?.altroTipologiaEnte,
                  numeroAbitanti: parsedState.fundData?.annualData?.numeroAbitanti,
                }] : 
                []
              )
          },
          fondoAccessorioDipendenteData: {
            ...defaultInitialState.fundData.fondoAccessorioDipendenteData,
            ...(parsedState.fundData?.fondoAccessorioDipendenteData || {}),
          },
          fondoElevateQualificazioniData: {
            ...defaultInitialState.fundData.fondoElevateQualificazioniData,
            ...(parsedState.fundData?.fondoElevateQualificazioniData || {}),
          },
          fondoSegretarioComunaleData: {
            ...defaultInitialState.fundData.fondoSegretarioComunaleData,
            ...(parsedState.fundData?.fondoSegretarioComunaleData || {}),
          },
          fondoDirigenzaData: {
            ...defaultInitialState.fundData.fondoDirigenzaData,
            ...(parsedState.fundData?.fondoDirigenzaData || {}),
          },
          distribuzioneRisorseData: {
            ...defaultInitialState.fundData.distribuzioneRisorseData,
            ...(parsedState.fundData?.distribuzioneRisorseData || {}),
          },
        },
        personaleServizio: {
          ...defaultInitialState.personaleServizio,
          ...(parsedState.personaleServizio || {}),
          dettagli:
            parsedState.personaleServizio?.dettagli || defaultInitialState.personaleServizio.dettagli,
        },
        isLoading: false,
        error: undefined,
        validationErrors: {},
      };

      if (parsedState.fundData?.annualData?.simulatoreInput) {
        mergedState.fundData.annualData.simulatoreInput = {
          ...defaultInitialState.fundData.annualData.simulatoreInput,
          ...parsedState.fundData.annualData.simulatoreInput,
        };
      }

      return mergedState;
    }
  } catch (error) {
    console.error('Could not load state from localStorage. Using default state.', error);
  }
  return defaultInitialState;
};

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
  performFundCalculation: () => Promise<void>;
  saveState: () => void;
  saveToDatabase: () => Promise<boolean>;
  loadFromDatabase: (year: number) => Promise<boolean>;
  getAvailableYears: () => Promise<number[]>;
}>({
  state: defaultInitialState,
  dispatch: () => null,
  performFundCalculation: async () => {},
  saveState: () => {},
  saveToDatabase: async () => false,
  loadFromDatabase: async () => false,
  getAvailableYears: async () => [],
});

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CURRENT_YEAR':
      return {
        ...state,
        currentYear: action.payload,
        fundData: {
          ...state.fundData,
          annualData: { ...state.fundData.annualData, annoRiferimento: action.payload },
        },
      };
    case 'SET_SELECTED_ENTITY':
      return {
        ...state,
        selectedEntityId: action.payload,
      };
    case 'UPDATE_HISTORICAL_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          historicalData: { ...state.fundData.historicalData, ...action.payload },
        },
      };
    case 'UPDATE_ANNUAL_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: { ...state.fundData.annualData, ...action.payload },
        },
      };
    case 'UPDATE_EMPLOYEE_COUNT': {
      const newCounts = state.fundData.annualData.personaleServizioAttuale.map((emp) =>
        emp.category === action.payload.category ? { ...emp, count: action.payload.count } : emp
      );
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: { ...state.fundData.annualData, personaleServizioAttuale: newCounts },
        },
      };
    }
    case 'UPDATE_SIMULATORE_INPUT':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            simulatoreInput: {
              ...state.fundData.annualData.simulatoreInput,
              ...action.payload,
            } as SimulatoreIncrementoInput,
          },
        },
      };
    case 'UPDATE_SIMULATORE_RISULTATI':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            simulatoreRisultati: action.payload,
          },
        },
      };
    case 'UPDATE_CALCOLATO_INCREMENTO_PNRR3':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            calcolatoIncrementoPNRR3: action.payload,
          },
        },
      };
    case 'UPDATE_FONDO_ACCESSORIO_DIPENDENTE_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoAccessorioDipendenteData: {
            ...state.fundData.fondoAccessorioDipendenteData,
            ...action.payload,
          } as FondoAccessorioDipendenteData,
        },
      };
    case 'UPDATE_FONDO_ELEVATE_QUALIFICAZIONI_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoElevateQualificazioniData: {
            ...state.fundData.fondoElevateQualificazioniData,
            ...action.payload,
          } as FondoElevateQualificazioniData,
        },
      };
    case 'UPDATE_FONDO_SEGRETARIO_COMUNALE_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoSegretarioComunaleData: {
            ...state.fundData.fondoSegretarioComunaleData,
            ...action.payload,
          } as FondoSegretarioComunaleData,
        },
      };
    case 'UPDATE_FONDO_DIRIGENZA_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoDirigenzaData: {
            ...state.fundData.fondoDirigenzaData,
            ...action.payload,
          } as FondoDirigenzaData,
        },
      };
    case 'UPDATE_DISTRIBUZIONE_RISORSE_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          distribuzioneRisorseData: {
            ...state.fundData.distribuzioneRisorseData,
            ...action.payload,
          } as DistribuzioneRisorseData,
        },
      };
    case 'ADD_PROVENTO_SPECIFICO':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            proventiSpecifici: [...state.fundData.annualData.proventiSpecifici, action.payload],
          },
        },
      };
    case 'UPDATE_PROVENTO_SPECIFICO': {
      const updatedProventi = [...state.fundData.annualData.proventiSpecifici];
      updatedProventi[action.payload.index] = action.payload.provento;
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: { ...state.fundData.annualData, proventiSpecifici: updatedProventi },
        },
      };
    }
    case 'REMOVE_PROVENTO_SPECIFICO': {
      const filteredProventi = state.fundData.annualData.proventiSpecifici.filter(
        (_, index) => index !== action.payload
      );
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: { ...state.fundData.annualData, proventiSpecifici: filteredProventi },
        },
      };
    }
    case 'ADD_ART23_EMPLOYEE_DETAIL': {
      const { yearType, detail } = action.payload;
      const key =
        yearType === '2018' ? 'personale2018PerArt23' : 'personaleAnnoRifPerArt23';
      const currentList = state.fundData.annualData[key] || [];
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            [key]: [...currentList, detail],
          },
        },
      };
    }
    case 'UPDATE_ART23_EMPLOYEE_DETAIL': {
      const { yearType, detail } = action.payload;
      const key =
        yearType === '2018' ? 'personale2018PerArt23' : 'personaleAnnoRifPerArt23';
      const currentList = [...(state.fundData.annualData[key] || [])];
      const index = currentList.findIndex((emp) => emp.id === detail.id);
      if (index !== -1) {
        currentList[index] = detail;
      }
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            [key]: currentList,
          },
        },
      };
    }
    case 'REMOVE_ART23_EMPLOYEE_DETAIL': {
      const { yearType, id } = action.payload;
      const key =
        yearType === '2018' ? 'personale2018PerArt23' : 'personaleAnnoRifPerArt23';
      const currentList = state.fundData.annualData[key] || [];
      const filteredList = currentList.filter((emp) => emp.id !== id);
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            [key]: filteredList,
          },
        },
      };
    }
    case 'ADD_PERSONALE_SERVIZIO_DETTAGLIO': {
      const newList = [...(state.personaleServizio.dettagli || []), action.payload];
      return {
        ...state,
        personaleServizio: {
          ...state.personaleServizio,
          dettagli: newList,
        },
      };
    }
    case 'UPDATE_PERSONALE_SERVIZIO_DETTAGLIO': {
      const { id, changes } = action.payload;
      const currentList = state.personaleServizio.dettagli || [];

      const updatedList = currentList.map((emp) => {
        if (emp.id !== id) {
          return emp;
        }

        const updatedEmployee = { ...emp, ...changes };
        const field = Object.keys(changes)[0] as keyof PersonaleServizioDettaglio;

        if (field === 'partTimePercentage' || field === 'numeroDifferenziali') {
          const rawValue = (changes as any)[field];
          (updatedEmployee as any)[field] =
            rawValue === '' || rawValue === undefined || rawValue === null
              ? undefined
              : Number(rawValue);
        } else if (field === 'livelloPeoStoriche' && (changes as any)[field] === '') {
          updatedEmployee.livelloPeoStoriche = undefined;
        }

        if (field === 'fullYearService' && updatedEmployee.fullYearService) {
          updatedEmployee.assunzioneDate = undefined;
          updatedEmployee.cessazioneDate = undefined;
        }
        if (field === 'areaQualifica') {
          updatedEmployee.livelloPeoStoriche = undefined;
          updatedEmployee.numeroDifferenziali = 0;
          updatedEmployee.tipoMaggiorazione = TipoMaggiorazione.NESSUNA;
        }

        return updatedEmployee;
      });

      return {
        ...state,
        personaleServizio: {
          ...state.personaleServizio,
          dettagli: updatedList,
        },
      };
    }
    case 'REMOVE_PERSONALE_SERVIZIO_DETTAGLIO': {
      const currentList = state.personaleServizio.dettagli || [];
      const filteredList = currentList.filter((emp) => emp.id !== action.payload.id);
      return {
        ...state,
        personaleServizio: {
          ...state.personaleServizio,
          dettagli: filteredList,
        },
      };
    }
    case 'SET_PERSONALE_SERVIZIO_DETTAGLI':
      return {
        ...state,
        personaleServizio: {
          ...state.personaleServizio,
          dettagli: action.payload,
        },
      };
    case 'CALCULATE_FUND_START':
      return { ...state, isLoading: true, error: undefined, validationErrors: {} };
    case 'CALCULATE_FUND_SUCCESS':
      return {
        ...state,
        isLoading: false,
        calculatedFund: action.payload.fund,
        complianceChecks: action.payload.checks,
        validationErrors: {},
      };
    case 'CALCULATE_FUND_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        calculatedFund: undefined,
        complianceChecks: [],
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'CLEAR_VALIDATION_ERRORS':
      return { ...state, validationErrors: {} };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
};

export const setValidationErrors = (dispatch: Dispatch<AppAction>, errors: Record<string, string>) => {
  dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
};

export const clearValidationErrors = (dispatch: Dispatch<AppAction>) => {
  dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, loadInitialState());
  const {
    data: normativeData,
    isLoading: isNormativeDataLoading,
    error: normativeDataError,
  } = useNormativeData();


  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        ...state,
        isLoading: undefined,
        error: undefined,
        validationErrors: undefined,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Could not save state to localStorage.', error);
    }
  }, [state]);

  // Nuove funzioni per il database
  const saveToDatabase = useCallback(async (): Promise<boolean> => {
    try {
      if (!state.selectedEntityId) {
        console.error('No entity selected for database save');
        return false;
      }
      const currentYear = state.currentYear;
      const success = await DatabaseService.upsertAnnualEntry(state.selectedEntityId, currentYear, state.fundData);
      if (success) {
        console.log(`Dati salvati nel database per l'anno ${currentYear}`);
      }
      return success;
    } catch (error) {
      console.error('Error saving to database:', error);
      return false;
    }
  }, [state.currentYear, state.fundData, state.selectedEntityId]);

  const loadFromDatabase = useCallback(async (year: number): Promise<boolean> => {
    try {
      if (!state.selectedEntityId) {
        console.error('No entity selected for database load');
        return false;
      }
      const data = await DatabaseService.getAnnualEntry(state.selectedEntityId, year);
      if (data) {
        // Apply migration logic for retrocompatibilità: convert legacy single entity to entita[] array
        const migratedAnnualData = {
          ...data.annualData,
          entita: data.annualData.entita || 
            (data.annualData.denominazioneEnte ? 
              [{
                id: 'migrated-entity',
                nome: data.annualData.denominazioneEnte,
                tipologia: data.annualData.tipologiaEnte,
                altroTipologia: data.annualData.altroTipologiaEnte,
                numeroAbitanti: data.annualData.numeroAbitanti,
              }] : 
              []
            )
        };
        
        dispatch({ type: 'SET_CURRENT_YEAR', payload: year });
        dispatch({ type: 'UPDATE_HISTORICAL_DATA', payload: data.historicalData });
        dispatch({ type: 'UPDATE_ANNUAL_DATA', payload: migratedAnnualData });
        dispatch({ type: 'UPDATE_FONDO_ACCESSORIO_DIPENDENTE_DATA', payload: data.fondoAccessorioDipendenteData });
        dispatch({ type: 'UPDATE_FONDO_ELEVATE_QUALIFICAZIONI_DATA', payload: data.fondoElevateQualificazioniData });
        dispatch({ type: 'UPDATE_FONDO_SEGRETARIO_COMUNALE_DATA', payload: data.fondoSegretarioComunaleData });
        dispatch({ type: 'UPDATE_FONDO_DIRIGENZA_DATA', payload: data.fondoDirigenzaData });
        dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: data.distribuzioneRisorseData });
        console.log(`Dati caricati dal database per l'anno ${year}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading from database:', error);
      return false;
    }
  }, [state.selectedEntityId]);

  // Auto-load data when entity is selected
  React.useEffect(() => {
    if (state.selectedEntityId && state.currentYear) {
      loadFromDatabase(state.currentYear);
    }
  }, [state.selectedEntityId, state.currentYear, loadFromDatabase]);

  const getAvailableYears = useCallback(async (): Promise<number[]> => {
    try {
      if (!state.selectedEntityId) {
        console.error('No entity selected for getAvailableYears');
        return [];
      }
      return await DatabaseService.getAvailableYears(state.selectedEntityId);
    } catch (error) {
      console.error('Error getting available years:', error);
      return [];
    }
  }, [state.selectedEntityId]);

  const performFundCalculation = useCallback(async () => {
    if (isNormativeDataLoading) {
      dispatch({
        type: 'CALCULATE_FUND_ERROR',
        payload: 'Dati normativi in caricamento. Riprova tra un momento.',
      });
      return;
    }
    if (normativeDataError || !normativeData) {
      dispatch({
        type: 'CALCULATE_FUND_ERROR',
        payload: `Impossibile caricare i dati normativi. L'applicazione potrebbe non funzionare correttamente. Errore: ${normativeDataError?.message}`,
      });
      return;
    }

    const validationErrors = validateFundData(state.fundData);
    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validationErrors });
      dispatch({
        type: 'CALCULATE_FUND_ERROR',
        payload: 'Sono presenti errori di validazione. Controlla i campi evidenziati.',
      });
      return;
    }

    dispatch({ type: 'CALCULATE_FUND_START' });
    try {
      const calculatedFund = calculateFundCompletely(state.fundData, normativeData);
      const complianceChecks = runAllComplianceChecks(calculatedFund, state.fundData, normativeData);
      dispatch({
        type: 'CALCULATE_FUND_SUCCESS',
        payload: { fund: calculatedFund, checks: complianceChecks },
      });
      saveState();
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      dispatch({ type: 'CALCULATE_FUND_ERROR', payload: `Errore nel calcolo: ${error}` });
      console.error('Calculation error:', e);
    }
  }, [state.fundData, saveState, normativeData, isNormativeDataLoading, normativeDataError]);

  const contextValue = {
    state: {
      ...state,
      isNormativeDataLoading,
      normativeData,
    },
    dispatch,
    performFundCalculation,
    saveState,
    saveToDatabase,
    loadFromDatabase,
    getAvailableYears,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);