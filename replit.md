# Salario Accessorio - Italian Local Administration Tool

## Overview
This is a React TypeScript application for calculating supplementary salaries for Italian local government entities. The application helps manage various funds including employee fund, management fund, and other specialized allocations according to Italian administrative regulations.

## Current State
- **Status**: Successfully imported and running on Replit
- **Frontend**: React 18 + TypeScript + Vite development server
- **Port**: 5000 (configured for Replit environment)
- **Dependencies**: All installed and working

## Recent Changes (September 11, 2025)
- Fixed package.json to use correct @google/genai version (1.17.0)
- Configured Vite for Replit environment with proper host settings (0.0.0.0:5000)
- Cleaned up duplicate file structure (removed root-level duplicates, kept src/ as single source)
- Fixed TypeScript path aliases and Vite configuration
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