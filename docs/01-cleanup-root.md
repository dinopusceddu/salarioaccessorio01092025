# Report: Pulizia della Directory di Root

Questo documento certifica l'avvenuta pulizia della directory di root del progetto, come richiesto, per centralizzare tutto il codice sorgente all'interno della directory `src/`.

## 1. File e Cartelle Rimossi

I seguenti file e cartelle, identificati come obsoleti o duplicati rispetto alla codebase presente in `src/`, sono stati rimossi dalla directory principale del progetto:

-   `App.tsx`
-   `index.tsx`
-   `types.ts`
-   `constants.ts`
-   `components/` (intera cartella)
-   `contexts/` (intera cartella)
-   `hooks/` (intera cartella)
-   `pages/` (intera cartella)
-   `services/` (intera cartella)

## 2. Motivazione

L'operazione è stata eseguita per eliminare il codice duplicato e obsoleto che risiedeva nella directory di root. Questa pulizia stabilisce `src/` come unica fonte di verità (`source of truth`) per il codice sorgente dell'applicazione, in linea con le pratiche standard di sviluppo.

Questa centralizzazione migliora la manutenibilità, riduce la confusione e assicura che lo sviluppo futuro si concentri su una codebase unica e coerente. L'applicazione continua a funzionare correttamente poiché il punto di ingresso in `index.html` punta già alla versione corretta dei file sorgente (`/src/index.tsx`).
