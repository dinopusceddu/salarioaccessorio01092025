// types.ts
import React from 'react';
import { z } from 'zod';
import {
  UserSchema,
  HistoricalDataSchema,
  Art23EmployeeDetailSchema,
  EmployeeCategorySchema,
  TipologiaEnteSchema,
  ProventoSpecificoSchema,
  SimulatoreIncrementoInputSchema,
  SimulatoreIncrementoRisultatiSchema,
  FondoDataBaseSchema,
  FondoElevateQualificazioniDataSchema,
  FondoSegretarioComunaleDataSchema,
  FondoDirigenzaDataSchema,
  LivelloPeoSchema,
  AreaQualificaSchema,
  TipoMaggiorazioneSchema,
  AnnualEmployeeCountSchema,
  AnnualDataSchema,
  RisorsaVariabileDetailSchema,
  DistribuzioneRisorseDataSchema,
  FundDataSchema,
  UserRoleSchema,
  NormativeDataSchema,
} from './schemas/fundDataSchemas';

// Re-export enums and export derived types
export const UserRole = UserRoleSchema.enum;
export type User = z.infer<typeof UserSchema>;

export type NormativeData = z.infer<typeof NormativeDataSchema>;

export type HistoricalData = z.infer<typeof HistoricalDataSchema>;

export type Art23EmployeeDetail = z.infer<typeof Art23EmployeeDetailSchema>;

export const EmployeeCategory = EmployeeCategorySchema.enum;
export type EmployeeCategory = z.infer<typeof EmployeeCategorySchema>;
export const ALL_EMPLOYEE_CATEGORIES: EmployeeCategory[] = Object.values(EmployeeCategory);

export const TipologiaEnte = TipologiaEnteSchema.enum;
export type TipologiaEnte = z.infer<typeof TipologiaEnteSchema>;

export type ProventoSpecifico = z.infer<typeof ProventoSpecificoSchema>;

export type SimulatoreIncrementoInput = z.infer<typeof SimulatoreIncrementoInputSchema>;
export type SimulatoreIncrementoRisultati = z.infer<typeof SimulatoreIncrementoRisultatiSchema>;

export type FondoAccessorioDipendenteData = z.infer<typeof FondoDataBaseSchema>;
export type FondoElevateQualificazioniData = z.infer<typeof FondoElevateQualificazioniDataSchema>;
export type FondoSegretarioComunaleData = z.infer<typeof FondoSegretarioComunaleDataSchema>;
export type FondoDirigenzaData = z.infer<typeof FondoDirigenzaDataSchema>;

export const LivelloPeo = LivelloPeoSchema.enum;
export type LivelloPeo = z.infer<typeof LivelloPeoSchema>;

export const AreaQualifica = AreaQualificaSchema.enum;
export type AreaQualifica = z.infer<typeof AreaQualificaSchema>;

export const TipoMaggiorazione = TipoMaggiorazioneSchema.enum;
export type TipoMaggiorazione = z.infer<typeof TipoMaggiorazioneSchema>;

// FIX: This schema was being imported and defined locally. Now it's defined in schemas/fundDataSchemas.ts and imported.
import { PersonaleServizioDettaglioSchema } from './schemas/fundDataSchemas';
export type PersonaleServizioDettaglio = z.infer<typeof PersonaleServizioDettaglioSchema>;

export type AnnualEmployeeCount = z.infer<typeof AnnualEmployeeCountSchema>;
export type AnnualData = z.infer<typeof AnnualDataSchema>;

export type RisorsaVariabileDetail = z.infer<typeof RisorsaVariabileDetailSchema>;
export type DistribuzioneRisorseData = z.infer<typeof DistribuzioneRisorseDataSchema>;

export type FundData = z.infer<typeof FundDataSchema>;

// Types that are not part of Zod schemas
export interface FundComponent {
  descrizione: string;
  importo: number;
  riferimento: string;
  tipo: 'stabile' | 'variabile';
  esclusoDalLimite2016?: boolean;
}

export interface FundDetailTotals {
  stabile: number;
  variabile: number;
  totale: number;
}

export interface CalculatedFund {
  fondoBase2016: number; 
  incrementiStabiliCCNL: FundComponent[];
  adeguamentoProCapite: FundComponent;
  incrementoDeterminatoArt23C2?: FundComponent; 
  incrementoOpzionaleVirtuosi?: FundComponent;
  risorseVariabili: FundComponent[];
  totaleFondoRisorseDecentrate: number;
  limiteArt23C2Modificato?: number; 
  ammontareSoggettoLimite2016: number;
  superamentoLimite2016?: number; 
  totaleRisorseSoggetteAlLimiteDaFondiSpecifici: number;
  
  totaleFondo: number;
  totaleParteStabile: number;
  totaleParteVariabile: number;
  
  totaleComponenteStabile: number; 
  totaleComponenteVariabile: number;

  dettaglioFondi: {
    dipendente: FundDetailTotals;
    eq: FundDetailTotals;
    segretario: FundDetailTotals;
    dirigenza: FundDetailTotals;
  };
}

export interface ComplianceCheck {
  id: string;
  descrizione: string;
  isCompliant: boolean;
  valoreAttuale?: string | number;
  limite?: string | number;
  messaggio: string;
  riferimentoNormativo: string;
  gravita: 'info' | 'warning' | 'error';
  relatedPage?: string;
}

export interface AppState {
  currentUser: User;
  currentYear: number;
  fundData: FundData;
  personaleServizio: {
    dettagli: PersonaleServizioDettaglio[];
  };
  calculatedFund?: CalculatedFund;
  complianceChecks: ComplianceCheck[];
  isLoading: boolean;
  isNormativeDataLoading: boolean;
  normativeData?: NormativeData;
  error?: string;
  // FIX: Added validationErrors to AppState
  validationErrors: { [key: string]: string };
  activeTab: string;
}

export type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_CURRENT_YEAR'; payload: number }
  | { type: 'UPDATE_HISTORICAL_DATA'; payload: Partial<HistoricalData> }
  | { type: 'UPDATE_ANNUAL_DATA'; payload: Partial<AnnualData> }
  | { type: 'ADD_PROVENTO_SPECIFICO'; payload: ProventoSpecifico }
  | { type: 'UPDATE_PROVENTO_SPECIFICO'; payload: { index: number; provento: ProventoSpecifico } }
  | { type: 'REMOVE_PROVENTO_SPECIFICO'; payload: number }
  | { type: 'CALCULATE_FUND_START' }
  | { type: 'CALCULATE_FUND_SUCCESS'; payload: { fund: CalculatedFund; checks: ComplianceCheck[] } }
  | { type: 'CALCULATE_FUND_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NORMATIVE_DATA_LOADING'; payload: boolean }
  | { type: 'SET_NORMATIVE_DATA'; payload: NormativeData }
  | { type: 'SET_ERROR'; payload: string | undefined }
  // FIX: Added SET_VALIDATION_ERRORS action
  | { type: 'SET_VALIDATION_ERRORS'; payload: { [key: string]: string } }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'ADD_ART23_EMPLOYEE_DETAIL'; payload: { yearType: '2018' | 'annoRif'; detail: Art23EmployeeDetail } }
  | { type: 'UPDATE_ART23_EMPLOYEE_DETAIL'; payload: { yearType: '2018' | 'annoRif'; detail: Art23EmployeeDetail } }
  | { type: 'REMOVE_ART23_EMPLOYEE_DETAIL'; payload: { yearType: '2018' | 'annoRif'; id: string } }
  | { type: 'ADD_PERSONALE_SERVIZIO_DETTAGLIO'; payload: PersonaleServizioDettaglio }
  | { type: 'UPDATE_PERSONALE_SERVIZIO_DETTAGLIO'; payload: { id: string; changes: Partial<PersonaleServizioDettaglio> } }
  | { type: 'REMOVE_PERSONALE_SERVIZIO_DETTAGLIO'; payload: { id: string } }
  | { type: 'SET_PERSONALE_SERVIZIO_DETTAGLI'; payload: PersonaleServizioDettaglio[] }
  | { type: 'UPDATE_SIMULATORE_INPUT'; payload: Partial<SimulatoreIncrementoInput> }
  | { type: 'UPDATE_SIMULATORE_RISULTATI'; payload: SimulatoreIncrementoRisultati | undefined } 
  | { type: 'UPDATE_FONDO_ACCESSORIO_DIPENDENTE_DATA'; payload: Partial<FondoAccessorioDipendenteData> }
  | { type: 'UPDATE_FONDO_ELEVATE_QUALIFICAZIONI_DATA'; payload: Partial<FondoElevateQualificazioniData> }
  | { type: 'UPDATE_FONDO_SEGRETARIO_COMUNALE_DATA'; payload: Partial<FondoSegretarioComunaleData> }
  | { type: 'UPDATE_FONDO_DIRIGENZA_DATA'; payload: Partial<FondoDirigenzaData> }
  | { type: 'UPDATE_CALCOLATO_INCREMENTO_PNRR3'; payload: number | undefined }
  | { type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA'; payload: Partial<DistribuzioneRisorseData> }
  | { type: 'UPDATE_EMPLOYEE_COUNT'; payload: { category: EmployeeCategory; count?: number } };

export interface PageModule {
  id: string;
  name: string;
  component: React.FC;
}