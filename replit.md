# Salario Accessorio - Italian Local Administration Tool

## Overview
This is a React TypeScript application for calculating supplementary salaries for Italian local government entities. The application helps manage various funds including employee fund, management fund, and other specialized allocations according to Italian administrative regulations.

## Current State
- **Status**: Successfully imported and running on Replit
- **Frontend**: React 18 + TypeScript + Vite development server
- **Port**: 5000 (configured for Replit environment)
- **Dependencies**: All installed and working

## Recent Changes (November 5, 2025)
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