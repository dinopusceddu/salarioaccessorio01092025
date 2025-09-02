// pages/CompliancePage.tsx
import React from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { Card } from '../components/shared/Card.tsx';
import { TEXTS_UI } from '../constants.ts';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { Button } from '../components/shared/Button.tsx';

const getIconForGravita = (gravita: 'info' | 'warning' | 'error'): string => {
  if (gravita === 'error') return '❌';
  if (gravita === 'warning') return '⚠️';
  return 'ℹ️';
};

// Adjusted colors to fit the new theme
const getStylesForGravita = (gravita: 'info' | 'warning' | 'error'): { card: string; title: string; iconText: string } => {
  if (gravita === 'error') return { 
    card: 'bg-[#fef2f2] border-[#fecaca]', // Lighter red, Tailwind red-50, border red-200
    title: 'text-[#991b1b]', // Tailwind red-800
    iconText: 'text-[#ef4444]' // Tailwind red-500
  };
  if (gravita === 'warning') return { 
    card: 'bg-[#fffbeb] border-[#fde68a]', // Lighter yellow, Tailwind amber-50, border amber-200
    title: 'text-[#92400e]', // Tailwind amber-800
    iconText: 'text-[#f59e0b]' // Tailwind amber-500
  };
  return { // info
    card: 'bg-[#eff6ff] border-[#bfdbfe]', // Lighter blue, Tailwind blue-50, border blue-200
    title: 'text-[#1e40af]', // Tailwind blue-800
    iconText: 'text-[#3b82f6]' // Tailwind blue-500
  };
};

export const CompliancePage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { complianceChecks, isLoading } = state;

  if (isLoading && (!complianceChecks || complianceChecks.length === 0)) {
    return <LoadingSpinner text="Caricamento controlli di conformità..." />;
  }

  if (!complianceChecks || complianceChecks.length === 0) {
    return (
      <Card title="Controllo dei limiti">
        <p className="text-[#1b0e0e]">{TEXTS_UI.noDataAvailable} Nessun controllo di conformità eseguito o dati non disponibili. Effettuare il calcolo del fondo.</p>
      </Card>
    );
  }

  const criticalIssues = complianceChecks.filter(c => c.gravita === 'error');
  const warnings = complianceChecks.filter(c => c.gravita === 'warning');
  const infos = complianceChecks.filter(c => c.gravita === 'info');

  const renderCheck = (check: typeof complianceChecks[0]) => (
    <div key={check.id} className={`p-4 mb-3 border rounded-lg ${getStylesForGravita(check.gravita).card}`}>
      <div className="flex items-start">
        <span className={`text-2xl mr-3 ${getStylesForGravita(check.gravita).iconText}`}>
          {getIconForGravita(check.gravita)}
        </span>
        <div className="flex-1">
          <h5 className={`font-semibold ${getStylesForGravita(check.gravita).title}`}>
            {check.descrizione}
          </h5>
          <p className="text-sm text-[#1b0e0e]">{check.messaggio}</p>
          <p className="text-xs text-[#5f5252] mt-1">
            Valore: {check.valoreAttuale ?? TEXTS_UI.notApplicable} {check.limite ? `(Limite: ${check.limite})` : ''} - Rif: {check.riferimentoNormativo}
          </p>
          {check.relatedPage && check.gravita !== 'info' && (
            <div className="mt-2">
                <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: check.relatedPage! })}
                >
                    Vai alla correzione →
                </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Controllo dei limiti</h2>
      
      {(criticalIssues.length > 0) && (
        <Card title="Criticità Rilevate" className="border-l-4 border-[#ea2832]">
            {criticalIssues.map(renderCheck)}
        </Card>
      )}

      {(warnings.length > 0) && (
        <Card title="Avvisi da Verificare" className="border-l-4 border-amber-500">
            {warnings.map(renderCheck)}
        </Card>
      )}


      <Card title="Controlli Positivi e Informativi">
        {infos.length > 0 ? (
          infos.map(renderCheck)
        ) : (
          <p className="text-[#5f5252] text-sm">Nessun controllo puramente informativo da mostrare.</p>
        )}
      </Card>
      
      <Card title="Guida al Piano di Recupero (Indicazioni Generali)" className="mt-6">
        <p className="text-sm text-[#1b0e0e]">In caso di superamento dei limiti di spesa (es. Art. 23, c.2, D.Lgs. 75/2017), l'ente è tenuto ad adottare un piano di recupero formale ai sensi dell'Art. 40, comma 3-quinquies, D.Lgs. 165/2001.</p>
        <ul className="list-disc list-inside text-sm text-[#1b0e0e] mt-2 space-y-1">
            <li>Il recupero avviene sulle risorse destinate al trattamento accessorio.</li>
            <li>Può essere effettuato con quote annuali (massimo 25% dell'eccedenza) o con proroga fino a cinque anni in casi specifici.</li>
            <li>È necessaria una formale deliberazione dell'ente.</li>
            <li>La mancata adozione del piano di recupero può configurare danno erariale.</li>
        </ul>
        <p className="text-xs text-[#5f5252] mt-3">Questa è una guida generica. Consultare la normativa e il proprio Organo di Revisione per l'applicazione specifica.</p>
      </Card>
    </div>
  );
};