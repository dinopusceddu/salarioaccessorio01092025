# 🐛 BUG: Data Misalignment Issue

## Problema
Cliccando su "Comune di Milano" vengono mostrati i dati di "Comune di Stezzano"

## Causa Root
1. Database di sviluppo VUOTO:
   - `entities` table: 0 righe
   - `annual_entries` table: 0 righe

2. localStorage contiene dati vecchi/cached

3. Flusso rotto:
   - Dashboard mostra entità (da dove?)
   - Click su entità → selectedEntityId = b5d65cbe-c1f4-453c-b420-de602a0e6789
   - loadFromDatabase() → database vuoto → fallback a localStorage
   - localStorage ha dati vecchi di "Comune di Stezzano"

## Verifica Necessaria
Dove viene "Comune di Milano" mostrato nella dashboard se database è vuoto?
