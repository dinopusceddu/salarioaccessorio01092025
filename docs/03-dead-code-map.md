# Static Code Analysis Report: Dead Code and Actionable Items

Questo report analizza la codebase all'interno della directory `src/` per identificare codice potenzialmente inutilizzato ("dead code") e commenti che indicano debito tecnico. L'obiettivo è fornire una roadmap per future operazioni di pulizia e refactoring.

## Tabella 1: File Non Utilizzati

I seguenti file esistono all'interno della struttura `src/` ma non risultano importati da nessun altro componente o pagina dell'applicazione attiva. Sono candidati primari per la rimozione.

| File Path                                 | Reasoning                                                                                                                             | Priority |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------- |
| `src/Hello.tsx`                           | Componente di esempio, non integrato nell'applicazione.                                                                               | Alta     |
| `src/components/Hello.tsx`                | Componente di esempio duplicato, non integrato.                                                                                       | Alta     |
| `src/hooks/useFundCalculations.ts`        | File vuoto.                                                                                                                           | Alta     |
| `src/hooks/useComplianceChecks.ts`        | File vuoto.                                                                                                                           | Alta     |
| `src/hooks/useSimulatoreCalculations.ts`  | Obsoleto. La logica è stata centralizzata in `src/logic/fundEngine.ts`.                                                                | Alta     |
| `src/logic/art23Calculations.ts`          | File vuoto.                                                                                                                           | Alta     |
| `src/logic/distributionCalculations.ts`   | File vuoto.                                                                                                                           | Alta     |
| `src/logic/fundCalculations.test.ts`      | File di test vuoto. Non contribuisce alla build di produzione.                                                                        | Media    |
| `src/logic/simulatoreCalculations.ts`     | File che esegue un re-export da un altro modulo. Può essere rimosso per semplificare la struttura.                                     | Media    |
| `src/pages/EmployeeData2025Page.tsx`      | File di pagina vuoto e non collegato alla navigazione.                                                                                | Alta     |
| `src/Card.tsx`, `src/Button.tsx`, etc.    | Molti file di componenti e pagine (`HomePage`, `AppContext`, etc.) esistono sia in `src/` che in `src/pages/`, `src/components/`. La versione attiva è quella nelle sottocartelle. I file nella root di `src/` sono obsoleti. | Alta     |

**Nota**: La codebase contiene una struttura di file duplicata. Ad esempio, `src/HomePage.tsx` e `src/pages/HomePage.tsx`. L'entry point dell'applicazione (`src/App.tsx`) utilizza la struttura nidificata (`src/pages/...`, `src/components/...`). Pertanto, tutti i file di codice sorgente nella root di `src/` sono considerati dead code.

---

## Tabella 2: Export Non Utilizzati

Le seguenti costanti/funzioni sono esportate ma non risultano importate da nessun file.

| File Path           | Export Name                  | Reasoning                                                                                             | Priority |
| :------------------ | :--------------------------- | :---------------------------------------------------------------------------------------------------- | :------- |
| `src/constants.ts`  | `ALL_LIVELLI_PEO`            | La pagina `PersonaleServizioPage` genera dinamicamente le opzioni per le PEO in base all'area.          | Alta     |
| `src/constants.ts`  | `ALL_NUMERO_DIFFERENZIALI`   | La pagina `PersonaleServizioPage` genera dinamicamente le opzioni per i differenziali in base all'area. | Alta     |

---

## Tabella 3: Technical Debt Comments (TODO, FIXME, FIX)

Elenco di commenti nel codice che segnalano debito tecnico o correzioni. I commenti `FIX:` sembrano indicare correzioni già apportate e servono come log storico; hanno quindi una priorità bassa per eventuali azioni future.

| File Path                                        | Line | Type | Comment                                                                              | Priority |
| :----------------------------------------------- | :--: | :--- | :----------------------------------------------------------------------------------- | :------- |
| `src/App.tsx`                                    | 5    | FIX  | Changed import from '@tanstack/react-query' to a namespace import...                 | Bassa    |
| `src/App.tsx`                                    | 13   | FIX  | Removed deprecated `suspense: true` option...                                        | Bassa    |
| `src/AppContext.tsx`                             | 20   | FIX  | Added missing properties to defaultInitialState                                    | Bassa    |
| `src/AppContext.tsx`                             | 171  | FIX  | Add cases for normative data                                                       | Bassa    |
| `src/AppContext.tsx`                             | 181  | FIX  | Fetch normative data on component mount                                              | Bassa    |
| `src/AppContext.tsx`                             | 198  | FIX  | Don't save loading states or fetched data to localStorage                            | Bassa    |
| `src/AppContext.tsx`                             | 208  | FIX  | Ensure normative data is loaded before calculating                                 | Bassa    |
| `src/AppContext.tsx`                             | 214  | FIX  | Corrected function calls to match definitions by passing normativeData             | Bassa    |
| `src/reportService.ts`                           | 16   | FIX  | Changed import from fundEngine to fundCalculations...                                | Bassa    |
| `src/reportService.ts`                           | 232  | FIX  | Corrected enum access from TitleCase to UPPERCASE.                                   | Bassa    |
| `src/reportService.ts`                           | 626  | FIX  | `getFadEffectiveValueHelper` expects 6 arguments...                                  | Bassa    |
| `src/pages/FondoDirigenzaPage.tsx`                 | 116  | FIX  | Added missing onChange prop to fix component error.                                  | Bassa    |
| `src/pages/FondoAccessorioDipendentePage.tsx`      | 6    | FIX  | Changed import to get the getFadFieldDefinitions function from the constant.         | Bassa    |
| `src/pages/FondoAccessorioDipendentePage.tsx`      | 113  | FIX  | Corrected typo from `isEnteInCondizioni` to `isEnteInCondizioniSpeciali`.          | Bassa    |
| `src/pages/DistribuzioneRisorsePage.tsx`         | 7    | FIX  | import getDistribuzioneFieldDefinitions function from the correct helper file        | Bassa    |
| `src/pages/FondoAccessorioDipendentePageHelpers.ts` | 4    | FIX  | Converted constant array to a function that depends on normativeData...              | Bassa    |
| `src/pages/FondoAccessorioDipendentePageHelpers.ts` | 68   | FIX  | Added getDistribuzioneFieldDefinitions to centralize definitions...                  | Bassa    |
| `src/pages/SimulatoreIncrementoForm.tsx`             | 44   | FIX  | Corrected enum access for TipologiaEnte.PROVINCIA to use uppercase key.              | Bassa    |
| `src/hooks/useNormativeData.ts`                  | 15   | FIX  | Replaced `useQuery` with `useSuspenseQuery` to correctly implement suspense.           | Bassa    |
| `src/logic/fundEngine.ts`                          | 12   | FIX  | Corrected enum access to use uppercase keys.                                       | Bassa    |
| `src/logic/complianceChecks.ts`                  | 141  | FIX  | Casted to string to fix type error                                                 | Bassa    |
| `src/logic/complianceChecks.ts`                  | 236  | FIX  | Casted to FondoElevateQualificazioniData to resolve type error.                        | Bassa    |
| `src/utils/formatters.ts`                        | 17   | FIX  | Added notApplicableText parameter to handle undefined values correctly.                | Bassa    |
| `src/components/dashboard/ContractedResourcesChart.tsx` | 27   | FIX  | Ensure description is a string before accessing length property                  | Bassa    |
