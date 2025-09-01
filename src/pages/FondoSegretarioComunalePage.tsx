// pages/FondoSegretarioComunalePage.tsx
import React, { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { FondoSegretarioComunaleData } from '../types.ts';
import { Card } from '../components/shared/Card.tsx';
import { TEXTS_UI } from '../constants.ts';
import { FundingItem } from '../components/shared/FundingItem.tsx';

const formatCurrency = (value?: number, defaultText = TEXTS_UI.notApplicable) => {
    if (value === undefined || value === null || isNaN(value)) return defaultText;
    return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SectionTotal: React.FC<{ label: string; total?: number, isPercentage?: boolean }> = ({ label, total, isPercentage = false }) => {
  const formatValue = () => {
    if (total === undefined || isNaN(total)) return TEXTS_UI.notApplicable;
    const formattedNumber = total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isPercentage ? `${formattedNumber}%` : `€ ${formattedNumber}`;
  };
  return (
    <div className="mt-4 pt-4 border-t-2 border-[#d1c0c1]">
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-[#1b0e0e]">{label}</span>
        <span className="text-lg font-bold text-[#ea2832]">
          {formatValue()}
        </span>
      </div>
    </div>
  );
};


export const FondoSegretarioComunalePage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const data = state.fundData.fondoSegretarioComunaleData || {} as FondoSegretarioComunaleData;
  const { normativeData } = state;

  if (!normativeData) return null;

  const { riferimenti_normativi: norme } = normativeData;

  const handleChange = (field: keyof FondoSegretarioComunaleData, value?: number) => {
    dispatch({ type: 'UPDATE_FONDO_SEGRETARIO_COMUNALE_DATA', payload: { [field]: value } });
  };
  
  const sommaRisorseStabili = 
    (data.st_art3c6_CCNL2011_retribuzionePosizione || 0) +
    (data.st_art58c1_CCNL2024_differenzialeAumento || 0) +
    (data.st_art60c1_CCNL2024_retribuzionePosizioneClassi || 0) +
    (data.st_art60c3_CCNL2024_maggiorazioneComplessita || 0) +
    (data.st_art60c5_CCNL2024_allineamentoDirigEQ || 0) +
    (data.st_art56c1g_CCNL2024_retribuzioneAggiuntivaConvenzioni || 0) +
    (data.st_art56c1h_CCNL2024_indennitaReggenzaSupplenza || 0);

  const sommaRisorseVariabili =
    (data.va_art56c1f_CCNL2024_dirittiSegreteria || 0) +
    (data.va_art56c1i_CCNL2024_altriCompensiLegge || 0) +
    (data.va_art8c3_DL13_2023_incrementoPNRR || 0) +
    (data.va_art61c2_CCNL2024_retribuzioneRisultato10 || 0) +
    (data.va_art61c2bis_CCNL2024_retribuzioneRisultato15 || 0) +
    (data.va_art61c2ter_CCNL2024_superamentoLimiteMetropolitane || 0) +
    (data.va_art61c3_CCNL2024_incremento022MonteSalari2018 || 0);
    
  const totaleRisorse = sommaRisorseStabili + sommaRisorseVariabili;
  const percentualeCopertura = data.fin_percentualeCoperturaPostoSegretario === undefined ? 100 : data.fin_percentualeCoperturaPostoSegretario;
  const itemsRilevantiPerLimite: (keyof FondoSegretarioComunaleData)[] = [
    'st_art3c6_CCNL2011_retribuzionePosizione',
    'st_art60c1_CCNL2024_retribuzionePosizioneClassi',
    'st_art60c3_CCNL2024_maggiorazioneComplessita',
    'st_art60c5_CCNL2024_allineamentoDirigEQ',
    'va_art61c2_CCNL2024_retribuzioneRisultato10',
    'va_art61c2bis_CCNL2024_retribuzioneRisultato15',
    'va_art61c2ter_CCNL2024_superamentoLimiteMetropolitane',
  ];
  const sommaBaseRisorseRilevantiLimite = itemsRilevantiPerLimite.reduce((sum, key) => {
    return sum + (data[key] || 0);
  }, 0);
  const totaleRisorseRilevantiLimiteCalcolato = sommaBaseRisorseRilevantiLimite * (percentualeCopertura / 100);
  
  useEffect(() => {
    if (data.fin_totaleRisorseRilevantiLimite !== totaleRisorseRilevantiLimiteCalcolato) {
        dispatch({
            type: 'UPDATE_FONDO_SEGRETARIO_COMUNALE_DATA',
            payload: { fin_totaleRisorseRilevantiLimite: isNaN(totaleRisorseRilevantiLimiteCalcolato) ? 0 : totaleRisorseRilevantiLimiteCalcolato }
        });
    }
  }, [data.fin_totaleRisorseRilevantiLimite, totaleRisorseRilevantiLimiteCalcolato, dispatch]);

  const totaleRisorseEffettivamenteDisponibili = totaleRisorse * (percentualeCopertura / 100);
  const infoTotaleRisorseRilevantiLimite = `Calcolato come: (Somma voci rilevanti per Art. 23 c.2) * (% Copertura Segretario). Valore base: ${TEXTS_UI.notApplicable === sommaBaseRisorseRilevantiLimite.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ? 'N/D' : '€ ' + sommaBaseRisorseRilevantiLimite.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;

  return (
    <div className="space-y-8 pb-20">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Risorse Segretario Comunale</h2>

      <Card title="RISORSE STABILI" className="mb-6" isCollapsible={true} defaultCollapsed={true}>
        <FundingItem<FondoSegretarioComunaleData> id="st_art3c6_CCNL2011_retribuzionePosizione" description="A seguito del conglobamento di cui al comma 5, con decorrenza dal 31.12.2009, i valori complessivi annui lordi, per tredici mensilità, della retribuzione di posizione dei segretari comunali e provinciali, di cui all'art. 3 del CCNL del 16 maggio 2001 per il biennio economico 2000-2001, sono così determinati." riferimentoNormativo={norme.ccnl_seg_01032011_art3c6} value={data.st_art3c6_CCNL2011_retribuzionePosizione} onChange={handleChange} />
        <FundingItem<FondoSegretarioComunaleData> id="st_art58c1_CCNL2024_differenzialeAumento" description="Con decorrenza dal 1° gennaio 2021, i valori complessivi annui lordi, per tredici mensilità, della retribuzione di posizione dei segretari comunali e provinciali, di cui all’art. 107, comma 1 del CCNL del 17.12.2020 sono rideterminati come indicato nella seguente tabella (riportare il solo differenziale di aumento rispetto il CCNL precedente che non rileva ai fini del limite)" riferimentoNormativo={norme.ccnl_seg_16072024_art58c1} value={data.st_art58c1_CCNL2024_differenzialeAumento} onChange={handleChange} />
        <FundingItem<FondoSegretarioComunaleData> id="st_art60c1_CCNL2024_retribuzionePosizioneClassi" description="La retribuzione di posizione è erogata, in base alle classi demografiche degli enti, entro i seguenti valori minimi e massimi complessivi annui lordi per tredici mensilità." riferimentoNormativo={norme.ccnl_seg_16072024_art60c1} value={data.st_art60c1_CCNL2024_retribuzionePosizioneClassi} onChange={handleChange} />
        <FundingItem