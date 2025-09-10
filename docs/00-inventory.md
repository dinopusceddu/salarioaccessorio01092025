# Inventory e Analisi Struttura Progetto

Questo documento analizza la struttura attuale del progetto, evidenziando duplicazioni e definendo i punti di ingresso principali. L'obiettivo è stabilire una base chiara per le future evoluzioni, decidendo di consolidare tutto il codice sorgente all'interno della directory `src/`.

## 1. Albero delle Cartelle (Profondità 2)

L'analisi mostra una duplicazione quasi completa della struttura delle cartelle tra la directory di root (`/`) e la directory `src/`.

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
├── hooks/
│   ├── useComplianceChecks.ts
│   └── useFundCalculations.ts
├── pages/
│   ├── Art23EmployeeEntryPage.tsx
│   ├── ChecklistPage.tsx
│   ├── CompliancePage.tsx
│   ├── DataEntryPage.tsx
│   ├── DistribuzioneRisorsePage.tsx
│   ├── FondoAccessorioDipendentePage.tsx
│   ├── FondoAccessorioDipendentePageHelpers.ts
│   ├── FondoDirigenzaPage.tsx
│   ├── FondoElevateQualificazioniPage.tsx
│   ├── FondoSegretarioComunalePage.tsx
│   ├── FundDetailsPage.tsx
│   ├── HomePage.tsx
│   ├── PersonaleServizioPage.tsx
│   └── ReportsPage.tsx
└── services/
    └── reportService.ts
```

### Struttura in `src/`

```
src/
├── components/
│   ├── dashboard/
│   ├── dataInput/
│   ├── layout/
│   ├── shared/
│   ├── ErrorBoundary.tsx
│   └── Hello.tsx
├── enums.ts
├── hooks/
│   ├── useNormativeData.ts
│   └── useSimulatoreCalculations.ts
├── logic/
│   ├── art23Calculations.ts
│   ├── complianceChecks.ts
│   ├── distributionCalculations.ts
│   ├── fundCalculations.ts
│   ├── fundCalculations.test.ts
│   ├── fundEngine.ts
│   ├── simulatoreCalculations.ts
│   └── validation.ts
├── pages/
│   ├── Art23EmployeeEntryPage.tsx
│   ├── ChecklistPage.tsx
│   ├── CompliancePage.tsx
│   ├── DataEntryPage.tsx
│   ├── DistribuzioneRisorsePage.tsx
│   ├── EmployeeData2025Page.tsx
│   ├── FondoAccessorioDipendentePage.tsx
│   ├── FondoAccessorioDipendentePageHelpers.ts
│   ├── FondoDirigenzaPage.tsx
│   ├── FondoElevateQualificazioniPage.tsx
│   ├── FondoSegretarioComunalePage.tsx
│   ├── FundDetailsPage.tsx
│   ├── HomePage.tsx
│   ├── PersonaleServizioPage.tsx
│   └── ReportsPage.tsx
├── schemas/
│   └── fundDataSchemas.ts
└── utils/
    └── formatters.ts
```

## 2. Elenco File Duplicati

Esiste una grave sovrapposizione di file con lo stesso nome e ruolo tra la root e `src/`. I file in `src/` sono generalmente più recenti, completi e utilizzano best practice moderne (es. Zod per la validazione dei tipi, React Query, Error Boundaries, Suspense).

| File/Cartella in Root | File/Cartella in `src/` | Decisione Preliminare |
| :--- | :--- | :--- |
| `App.tsx` | `src/App.tsx` | Mantenere `src/App.tsx` |
| `components/` | `src/components/` | Mantenere `src/components/` |
| `constants.ts` | `src/constants.ts` | Mantenere `src/constants.ts` |
| `contexts/AppContext.tsx` | `src/contexts/AppContext.tsx` | Mantenere `src/contexts/AppContext.tsx` (spostato da `src/`) |
| `index.tsx` | `src/index.tsx` | Mantenere `src/index.tsx` |
| `logic/` (inesistente) | `src/logic/` | Struttura corretta in `src/` |
| `pages/` | `src/pages/` | Mantenere `src/pages/` |
| `services/reportService.ts` | `src/reportService.ts` | Mantenere `src/reportService.ts` (spostato da `src/`) |
| `types.ts` | `src/types.ts` | Mantenere `src/types.ts` (basato su Zod) |

**Conclusione**: La directory di root contiene una versione obsoleta dell'applicazione. La directory `src/` è la fonte di verità (source of truth) e dovrebbe essere l'unica utilizzata.

## 3. Entry Point e Configurazioni

-   **HTML Entry Point**: `index.html`. Carica lo script compilato da `index.tsx` (attualmente quello in root, ma dovrebbe puntare a `src/index.tsx`).
-   **React Entry Point**: `index.tsx` -> `App.tsx`.
    -   La versione in `src/App.tsx` è la più completa, integrando `React Query`, `Suspense`, `ErrorBoundary` e una logica di routing più robusta.
-   **Build Config**: `vite.config.ts` è configurato correttamente per un'applicazione React con TypeScript.
-   **TypeScript Config**: `tsconfig.json` e `tsconfig.node.json` sono presenti e standard.
-   **Versioni Librerie** (da `index.html` `importmap`):
    -   React: `^19.1.0`
    -   React DOM: `^19.1.0`
    -   `@tanstack/react-query`: `^5.51.1`
    -   Zod: `^4.1.5`

## 4. Decisione Strategica: `radice = src/`

**La directory di root (`/`) deve essere considerata una copia obsoleta e il suo contenuto duplicato deve essere rimosso.**

Tutto il codice sorgente dell'applicazione risiede in `src/`. Questa struttura è standard e favorisce la manutenibilità. I prossimi passaggi dovrebbero includere:
1.  Rimuovere tutte le cartelle e i file di codice sorgente duplicati dalla root (`App.tsx`, `components/`, `pages/`, `types.ts`, etc.).
2.  Assicurarsi che `index.html` carichi lo script compilato da `src/index.tsx`.

Questa operazione di pulizia è fondamentale per evitare confusione e garantire che le modifiche vengano applicate alla versione corretta del codice.
