# Salario Accessorio - Italian Local Administration Tool

## Overview
This is a React TypeScript application for calculating supplementary salaries for Italian local government entities. The application helps manage various funds including employee fund, management fund, and other specialized allocations according to Italian administrative regulations.

## Current State
- **Status**: Successfully imported and running on Replit
- **Frontend**: React 18 + TypeScript + Vite development server
- **Port**: 5000 (configured for Replit environment)
- **Dependencies**: All installed and working

## Recent Changes (November 12, 2025)
- **FIX LOGO IN PRODUZIONE**: Risolto problema logo FP CGIL non visibile in deployment
  - **Problema**: Il logo non appariva nel sito pubblicato perché i file in `attached_assets/` non vengono inclusi nel build di produzione
  - **Soluzione**: Spostato il logo da `attached_assets/` a `public/logo-fp-cgil.jpg` e aggiornati tutti i riferimenti in LoginPage e DashboardPage
  - **Risultato**: Il logo ora appare correttamente sia in sviluppo che in produzione
- **AUTO-SINCRONIZZAZIONE FONDO-DISTRIBUZIONE**: Implementato sistema automatico di allineamento tra Fondo Accessorio e Distribuzione Risorse
  - **Auto-compilazione**: Quando si inseriscono valori nel Fondo Accessorio Dipendente, i corrispondenti campi in Distribuzione Risorse vengono automaticamente compilati
  - **Mapping campi**: 
    * Recupero evasione ICI → Incentivi conto terzi
    * Risorse personale case da gioco → Compensi case da gioco
    * Quota rimborso spese notifica → Compensi messi notificatori
    * Incentivi funzioni tecniche → Incentivi condono/funzioni tecniche pre-2018
    * Incentivi spese giudizio → Compensi avvocatura
    * Incentivi riscossione IMU/TARI → Incentivi IMU/TARI
  - **Arrotondamento**: Tutti i valori in Distribuzione Risorse arrotondati automaticamente a 2 cifre decimali
  - **Compliance check**: Nuovi controlli di conformità verificano allineamento Fondo-Distribuzione e generano warning se modifiche manuali creano discordanze
  - **File**: Configurazione in `src/config/fondoDistribuzioneMapping.ts`, logica in AppContext.tsx, controlli in complianceChecks.ts
- **BUG FIX - Simulatore e Art23 non visibili**: Risolto problema di case sensitivity nella tipologia ente
  - **Problema**: I form "Simulatore Incremento" e "Art. 23" non apparivano per i Comuni
  - **Causa**: Database salva "comune" (minuscolo) ma enum richiede "Comune" (maiuscolo) - confronto falliva
  - **Fix 1**: Creata funzione normalizeTipologia() in database.ts per convertire valori database all'enum
  - **Fix 2**: Aggiornato DataEntryPage e SimulatoreIncrementoForm per usare normalizeTipologia()
  - **Fix 3**: SimulatoreIncrementoForm ora carica numero abitanti e tipologia direttamente dal database entity
  - **Risultato**: I form ora appaiono correttamente per Comuni e Province, usando dati corretti dall'entità
- **ENTITY/YEAR MANAGEMENT**: Complete entity and year data management capabilities
  - **Delete Entity**: Button to delete entire entities with all their data - includes confirmation modal with clear warnings
  - **Delete Year**: Individual year deletion per entity - removes only specific year's data with confirmation
  - **Duplicate Year**: Copy all fund data from one year to another (e.g., 2025 → 2026) with customizable target year
  - **UI/UX**: Card-based year display with action buttons (Duplica, Elimina) alongside main "Apri Anno" button
  - **Safety**: All destructive operations require explicit confirmation modals to prevent accidental data loss
  - **Implementation**: DatabaseService.duplicateYear() clones entire FundData payload with updated annoRiferimento
- **ADMIN PANEL CONSOLIDATION**: Centralized admin panel access exclusively to Dashboard
  - **Removed**: Admin panel button from HomePage and all fund pages
  - **Removed**: Separate AdminPage.tsx file and routing
  - **Added**: "Rendi Admin/User" functionality to Dashboard admin panel
  - **Location**: Admin panel now accessible ONLY from Dashboard via "👤 Amministrazione" button
  - **Features**: All admin functions consolidated - create users, manage roles, reset passwords, delete users, view entities/years per user
  - **Security**: Self-protection - admins cannot delete or demote themselves
  - **UI**: Consistent design with FP CGIL Lombardia branding throughout admin interface
- **BUG FIX - Data Leakage Between Entities**: Fixed critical issue where data from one entity appeared in another
  - **Issue**: When selecting a new entity, the form showed data from the previously selected entity
  - **Root Cause**: Race condition between auto-save and data loading - auto-save would save old data to new entity
  - **Fix**: Added immediate reset of all data when selectedEntityId changes (before loading from database)
  - **Resolution**: Each entity now starts with a clean, empty form unless data exists in database
  - **Implementation**: New useEffect in AppContext.tsx resets all fundData to INITIAL values on entity change
- **UX IMPROVEMENT - Removed ALL Validation Blockers**: Eliminated all validation errors across entire application
  - **Issue**: Alert "Sono presenti errori di validazione" blocked calculation without showing which fields had errors
  - **Fix 1**: Removed validation block from performFundCalculation in AppContext.tsx (lines 685-693)
  - **Fix 2**: Removed client-side validation logic from DataEntryPage.tsx
  - **Resolution**: Calculation now proceeds regardless of data validation state
  - **Impact**: Users can enter data freely and perform calculations without validation interruptions
- **BUG FIX - Entity Name Display**: Fixed "Ente non specificato" appearing in HomePage and missing components in DataEntryPage
  - **Root Cause**: Functions getPrimaryEntityName/Tipologia relied on entita[] array which was empty after database reset
  - **Fix**: Modified HomePage and DataEntryPage to load entity data directly from database using selectedEntityId
  - **Resolution**: Entity name now displays correctly in page title, Art23 and Simulatore components now appear for Comuni
  - **Implementation**: Added useEffect hooks to fetch entity data via DatabaseService.getEntity()
- **BUG FIX - Data Misalignment**: Fixed entity data corruption where clicking "Comune di Milano" showed data from "Comune di Stezzano"
  - **Root Cause**: Annual entries for entity ID contained wrong denominazioneEnte and entita data
  - **Fix**: Added detailed logging to track entity selection flow (🔍 CLICK, 📥 LOAD logs)
  - **Resolution**: Cleared corrupted data from database, allowing fresh start with correct entity alignment
  - **Prevention**: Enhanced logging now catches entity/data mismatches immediately
- **ADMIN PANEL ENHANCEMENTS**: Comprehensive user management with full CRUD operations
  - **Edge Functions**: Successfully deployed admin-delete-user, admin-reset-password, admin-get-user-entities via Supabase Management API
  - **Deployment Method**: Used Management API (POST multipart/form-data) instead of CLI due to Docker unavailability on Replit
  - **User Actions**: Delete users, reset passwords, view user's entities and years - all with proper confirmations
  - **Entity Visibility**: Expandable user rows showing all entities and years associated with each user
  - **Security**: All admin operations protected by JWT validation and role checks in edge functions
  - **UI/UX**: Modal confirmations for destructive actions, real-time feedback, disabled self-deletion
- **ENTITY WORKFLOW FIX**: Removed entity editing form from main app, entity/year now selected only from dashboard (user → entity → year workflow)
  - Created SelectedEntityDisplay component to show readonly entity and year information
  - Added DatabaseService.getEntity() method for fetching single entity details
  - Removed MultipleEntitaForm from EntityGeneralInfoForm - entity changes now only through dashboard
- **DEPLOYMENT FIX**: Added preview server port configuration to vite.config.ts (preview server now correctly uses port 5000 instead of default 4173)
- **UI REDESIGN**: Complete rebrand with FP CGIL Lombardia logo and consistent color palette (#fcf8f8, #1b0e0e, #994d51, #5f5252)
- **ADMIN PANEL**: Implemented comprehensive admin controls in DashboardPage with user creation and management
- **NAVIGATION**: Added logout button in dashboard, "← Dashboard" button in app header, admin access from HomePage
- **BUG FIX - Data Caching**: Fixed AppContext.loadFromDatabase() to reset all data to initial values when no database data exists, preventing cross-entity data leakage
- Configured Vite for Replit environment with proper host settings (0.0.0.0:5000)
- Set up deployment configuration for autoscale deployment
- Created workflow for frontend development server

## Project Architecture
### Frontend Structure
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **UI**: Tailwind CSS (via CDN)
- **State Management**: React Context (AppContext)
- **Charts**: Recharts library
- **PDF Generation**: jsPDF + jspdf-autotable

### Key Components
- Dashboard with compliance widgets and fund allocation charts
- Data entry forms for various fund types
- Compliance checking system
- Interactive checklist with AI assistance
- Report generation capabilities

### Main Pages/Modules
1. Welcome page
2. Fund constitution data entry
3. Employee fund management (Fondo Accessorio Personale)
4. High qualifications fund (Fondo Elevate Qualificazioni)
5. Municipal secretary resources
6. Management fund (when applicable)
7. Personnel in service
8. Resource distribution
9. Calculated fund details
10. Compliance checking
11. Interactive checklist (AI-powered)
12. Reports and PDF generation

## User Preferences
- Language: Italian interface
- Currency: Euro formatting
- Focus: Administrative compliance and calculation accuracy

## Known Limitations & Security Notes
⚠️ **SECURITY CONCERN**: The Gemini AI integration currently exposes the API key client-side via `VITE_GEMINI_API_KEY`. This is not secure for production use.

**Recommended Fix**: Move AI functionality to a backend proxy to protect the API key. The current implementation in ChecklistPage.tsx calls the Gemini API directly from the browser, which exposes the key and may have API compatibility issues.

## Environment Setup
- Environment file: `.env.local` contains `VITE_GEMINI_API_KEY`
- Development server: `npm run dev` on port 5000
- Build: `npm run build` 
- Preview: `npm run preview`

## Deployment Configuration
- Target: Autoscale deployment
- Build command: `npm run build`
- Run command: `npm run preview`
- Port: 5000

## Dependencies Status
✅ All npm dependencies installed successfully
✅ Development server running
✅ TypeScript configuration working
✅ Vite configuration optimized for Replit
✅ Workflow configured and operational