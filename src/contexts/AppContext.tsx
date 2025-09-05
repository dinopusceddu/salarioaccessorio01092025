// contexts/AppContext.tsx
import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';

import { 
    INITIAL_ANNUAL_DATA, 
    DEFAULT_CURRENT_YEAR, 
    DEFAULT_USER, 
    INITIAL_DISTRIBUZIONE_RISORSE_DATA, 
    INITIAL_FONDO_ACCESSORIO_DIPENDENTE_DATA, 
    INITIAL_FONDO_DIRIGENZA_DATA, 
    INITIAL_FONDO_ELEVATE_QUALIFICAZIONI_DATA, 
    INITIAL_FONDO_SEGRETARIO_COMUNALE_DATA, 
    INITIAL_HISTORICAL_DATA 
} from '../constants.ts';
import { 
  calculateFundCompletely,
  runAllComplianceChecks,
} from '../logic/fundEngine.ts';
import { validateFundData } from '../logic/validation.ts';
import { 
  AppAction,
  AppState,
  Art23EmployeeDetail,
  DistribuzioneRisorseData,
  FondoAccessorioDipendenteData,
  FondoDirigenzaData,
  FondoElevateQualificazioniData,
  FondoSegretarioComunaleData,
  NormativeData,
  PersonaleServizioDettaglio,
  SimulatoreIncrementoInput,
  TipoMaggiorazione,
} from '../types.ts';

const LOCAL_STORAGE_KEY = 'salario-accessorio-app-state';

const defaultInitialState: AppState = {
  currentUser: DEFAULT_USER,
  currentYear: DEFAULT_CURRENT_YEAR,
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

// Function to load the initial state from localStorage
const loadInitialState = (): AppState => {
  try {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);

      // Migration for the refactored state: move personaleServizioDettagli to top-level personaleServizio
      if (parsedState.fundData?.annualData?.personaleServizioDettagli) {
        if (!parsedState.personaleServizio) {
          parsedState.personaleServizio = { dettagli: [] };
        }
        parsedState.personaleServizio.dettagli =
          parsedState.fundData.annualData.personaleServizioDettagli;
        delete parsedState.fundData.annualData.personaleServizioDettagli;
      }

      return {
        ...defaultInitialState,
        ...parsedState,
        isLoading: false,
        isNormativeDataLoading: true, // Always true on start, will be set to false after fetch
        error: undefined,
        validationErrors: {},
      };
    }
  } catch (error) {
    console.error(
      'Could not load state from localStorage. Using default state.',
      error
    );
  }
  return defaultInitialState;
};

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
  performFundCalculation: () => Promise<void>;
  saveState: () => void;
}>({
  state: defaultInitialState,
  dispatch: () => null,
  performFundCalculation: async () => {},
  saveState: () => {},
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
          annualData: {
            ...state.fundData.annualData,
            annoRiferimento: action.payload,
          },
        },
      };
    case 'UPDATE_HISTORICAL_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          historicalData: {
            ...state.fundData.historicalData,
            ...action.payload,
          },
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
      const newCounts =
        state.fundData.annualData.personaleServizioAttuale.map((emp) =>
          emp.category === action.payload.category
            ? { ...emp, count: action.payload.count }
            : emp
        );
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            personaleServizioAttuale: newCounts,
          },
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
            proventiSpecifici: [
              ...state.fundData.annualData.proventiSpecifici,
              action.payload,
            ],
          },
        },
      };
    case 'UPDATE_PROVENTO_SPECIFICO': {
      const updatedProventi = [
        ...state.fundData.annualData.proventiSpecifici,
      ];
      updatedProventi[action.payload.index] = action.payload.provento;
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            proventiSpecifici: updatedProventi,
          },
        },
      };
    }
    case 'REMOVE_PROVENTO_SPECIFICO': {
      const filteredProventi =
        state.fundData.annualData.proventiSpecifici.filter(
          (_, index) => index !== action.payload
        );
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            proventiSpecifici: filteredProventi,
          },
        },
      };
    }
    case 'ADD_ART23_EMPLOYEE_DETAIL': {
      const { yearType, detail } = action.payload;
      const key =
        yearType === '2018'
          ? 'personale2018PerArt23'
          : 'personaleAnnoRifPerArt23';
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
        yearType === '2018'
          ? 'personale2018PerArt23'
          : 'personaleAnnoRifPerArt23';
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
        yearType === '2018'
          ? 'personale2018PerArt23'
          : 'personaleAnnoRifPerArt23';
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
        } else if (
          field === 'livelloPeoStoriche' &&
          (changes as any)[field] === ''
        ) {
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
      const filteredList = currentList.filter(
        (emp) => emp.id !== action.payload.id
      );
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
    case 'SET_NORMATIVE_DATA_LOADING':
      return { ...state, isNormativeDataLoading: action.payload };
    case 'SET_NORMATIVE_DATA':
      return { ...state, normativeData: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, loadInitialState());

  useEffect(() => {
    const fetchNormativeData = async () => {
      dispatch({ type: 'SET_NORMATIVE_DATA_LOADING', payload: true });
      try {
        const response = await fetch('/normativa.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: NormativeData = await response.json();
        dispatch({ type: 'SET_NORMATIVE_DATA', payload: data });
      } catch (error) {
        console.error('Failed to fetch normative data:', error);
        dispatch({
          type: 'SET_ERROR',
          payload:
            "Impossibile caricare i dati normativi. L'applicazione potrebbe non funzionare correttamente.",
        });
      } finally {
        dispatch({ type: 'SET_NORMATIVE_DATA_LOADING', payload: false });
      }
    };
    fetchNormativeData();
  }, []);

  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        ...state,
        isLoading: undefined,
        error: undefined,
        isNormativeDataLoading: undefined,
        normativeData: undefined,
        validationErrors: undefined,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Could not save state to localStorage.', error);
    }
  }, [state]);

  const performFundCalculation = useCallback(async () => {
    dispatch({ type: 'SET_ERROR', payload: undefined });

    const validationErrors = validateFundData(state.fundData);
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validationErrors });

    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'CALCULATE_FUND_ERROR', payload: 'Sono presenti errori di validazione nei dati inseriti. Si prega di correggerli.' });
      return;
    }

    if (!state.normativeData) {
      dispatch({
        type: 'CALCULATE_FUND_ERROR',
        payload:
          'Dati normativi non caricati. Impossibile eseguire il calcolo.',
      });
      return;
    }
    dispatch({ type: 'CALCULATE_FUND_START' });
    try {
      const calculatedFund = calculateFundCompletely(
        state.fundData,
        state.normativeData
      );
      const complianceChecks = runAllComplianceChecks(
        calculatedFund,
        state.fundData,
        state.normativeData
      );
      dispatch({
        type: 'CALCULATE_FUND_SUCCESS',
        payload: { fund: calculatedFund, checks: complianceChecks },
      });
      saveState();
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      dispatch({
        type: 'CALCULATE_FUND_ERROR',
        payload: `Errore nel calcolo: ${error}`,
      });
      console.error('Calculation error:', e);
    }
  }, [state.fundData, state.normativeData, saveState]);

  return (
    <AppContext.Provider
      value={{ state, dispatch, performFundCalculation, saveState }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
