# Inventario e Analisi Struttura Progetto (Nuovo)

Questo documento analizza la struttura attuale del progetto, evidenziando duplicazioni e definendo i punti di ingresso principali.

## 1. Albero delle Cartelle (Profondità 2)

### Struttura in Root (`/`)

```
.
├── components/
│   ├── dataInput/
│   ├── dashboard/
│   ├── layout/
│   └── shared/
├── contexts/
│   └── AppContext.tsx
├── docs/
│   ├── 00-inventory.md
│   ├── 01-cleanup-report.md
│   ├── 02-lint-typecheck-report.md
│   ├── 03-dead-code-map.md
│   └── 03b-dead-code-deleted.md
├── hooks/
│   ├── useComplianceChecks.ts
│   └── useFundCalculations.ts
├── pages/
│   ├── Art23EmployeeEntryPage.tsx
│   ├── ChecklistPage.tsx
│   ├── ... (e altri file di pagina)
│   └── ReportsPage.tsx
├── public/
│   └── normativa.json
├── services/
│   └── reportService.ts
├── src/
│   └── ... (vedi struttura src sotto)
├── App.tsx
├── constants.ts
├── index.html
├── index.tsx
├── package.json
├── types.ts
└── vite.config.ts
```

### Struttura in `src/`

```
src/
├── components/
│   ├── dashboard/
│   ├── dataInput/
│   ├── layout/
│   └── shared/
├── contexts/
│   └── AppContext.tsx
├── hooks/
│   ├── useNormativeData.ts
│   └── useSimulatoreCalculations.ts
├── logic/
│   ├── complianceChecks.ts
│   ├── fundCalculations.ts
│   ├── fundEngine.ts
│   └── ... (e altri file di logica)
├── pages/
│   ├── Art23EmployeeEntryPage.tsx
│   ├── ChecklistPage.tsx
│   ├── ... (e altri file di pagina)
│   └── SimulatoreIncrementoForm.tsx
├── schemas/
│   └── fundDataSchemas.ts
└── utils/
    └── formatters.ts
```
*(Nota: la struttura di `src/` contiene anche numerosi file "piatti" che sono duplicati di quelli nelle sottocartelle, come descritto nella Sezione 3)*

## 2. Tabella File Duplicati tra Root e `src/`

La codebase presenta una duplicazione quasi totale dei file sorgente tra la directory di root e la directory `src/`. La versione in `src/` è quella più aggiornata e mantenuta.

| File/Cartella in Root      | File/Cartella in `src/`             | Note                                            |
| :------------------------- | :---------------------------------- | :---------------------------------------------- |
| `App.tsx`                  | `src/App.tsx`                       | File principale dell'applicazione.              |
| `components/`              | `src/components/`                   | Intera struttura dei componenti.                |
| `constants.ts`             | `src/constants.ts`                  | Costanti dell'applicazione.                     |
| `contexts/AppContext.tsx`  | `src/contexts/AppContext.tsx`       | Context provider principale.                    |
| `hooks/*`                  | `src/hooks/*` (parziale)            | Hooks personalizzati.                           |
| `index.tsx`                | `src/index.tsx`                     | Entry point React.                              |
| `pages/`                   | `src/pages/`                        | Intera struttura delle pagine.                  |
| `services/reportService.ts`| `src/reportService.ts`              | Servizio di generazione report.                 |
| `types.ts`                 | `src/types.ts`                      | Definizioni dei tipi.                           |

## 3. Elenco File "Piatti" in `src/` che Duplicano File Nelle Sottocartelle

All'interno della directory `src/` stessa, esiste una seconda duplicazione: molti file si trovano sia nella root di `src/` sia nelle loro sottocartelle canoniche (es. `src/components/`). La versione corretta e utilizzata dall'applicazione è quella all'interno delle sottocartelle.

- **Pagine:**
    - `src/HomePage.tsx` (duplica `src/pages/HomePage.tsx`)
    - `src/DataEntryPage.tsx` (duplica `src/pages/DataEntryPage.tsx`)
    - `src/FundDetailsPage.tsx` (duplica `src/pages/FundDetailsPage.tsx`)
    - `src/CompliancePage.tsx` (duplica `src/pages/CompliancePage.tsx`)
    - `src/ReportsPage.tsx` (duplica `src/pages/ReportsPage.tsx`)
- **Componenti Condivisi:**
    - `src/Card.tsx` (duplica `src/components/shared/Card.tsx`)
    - `src/Button.tsx` (duplica `src/components/shared/Button.tsx`)
    - `src/Input.tsx` (duplica `src/components/shared/Input.tsx`)
    - `src/Select.tsx` (duplica `src/components/shared/Select.tsx`)
    - `src/LoadingSpinner.tsx` (duplica `src/components/shared/LoadingSpinner.tsx`)
- **Componenti di Layout:**
    - `src/Header.tsx` (duplica `src/components/layout/Header.tsx`)
    - `src/Sidebar.tsx` (duplica `src/components/layout/Sidebar.tsx`)
    - `src/MainLayout.tsx` (duplica `src/components/layout/MainLayout.tsx`)
- **Componenti Data Input:**
    - `src/HistoricalDataForm.tsx` (duplica `src/components/dataInput/HistoricalDataForm.tsx`)
    - `src/EmployeeCountsForm.tsx` (duplica `src/components/dataInput/EmployeeCountsForm.tsx`)
    - `src/ProventiSpecificiForm.tsx` (duplica `src/components/dataInput/ProventiSpecificiForm.tsx`)
    - `src/AnnualDataForm.tsx` (duplica `src/components/dataInput/AnnualDataForm.tsx`)
- **Componenti Dashboard:**
    - `src/DashboardSummary.tsx` (duplica `src/components/dashboard/DashboardSummary.tsx`)
    - `src/ComplianceStatusWidget.tsx` (duplica `src/components/dashboard/ComplianceStatusWidget.tsx`)
- **Altro:**
    - `src/AppContext.tsx` (duplica `src/contexts/AppContext.tsx`)
    - `src/reportService.ts` (duplica il file in `services/` nella root)
