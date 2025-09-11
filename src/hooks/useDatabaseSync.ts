// hooks/useDatabaseSync.ts - Hook per sincronizzazione database
import { useCallback, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export const useDatabaseSync = () => {
  const { saveToDatabase, loadFromDatabase, getAvailableYears } = useAppContext();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveCurrentData = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Devi essere autenticato per salvare i dati' };
    }

    setIsSaving(true);
    try {
      const success = await saveToDatabase();
      const message = success 
        ? 'Dati salvati con successo nel database!' 
        : 'Errore durante il salvataggio nel database';
      return { success, message };
    } catch (error) {
      return { success: false, message: 'Errore durante il salvataggio: ' + error };
    } finally {
      setIsSaving(false);
    }
  }, [user, saveToDatabase]);

  const loadYearData = useCallback(async (year: number): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Devi essere autenticato per caricare i dati' };
    }

    setIsLoading(true);
    try {
      const success = await loadFromDatabase(year);
      const message = success 
        ? `Dati dell'anno ${year} caricati con successo!` 
        : `Nessun dato trovato per l'anno ${year}`;
      return { success, message };
    } catch (error) {
      return { success: false, message: 'Errore durante il caricamento: ' + error };
    } finally {
      setIsLoading(false);
    }
  }, [user, loadFromDatabase]);

  const getYears = useCallback(async (): Promise<number[]> => {
    if (!user) return [];
    try {
      return await getAvailableYears();
    } catch (error) {
      console.error('Error getting available years:', error);
      return [];
    }
  }, [user, getAvailableYears]);

  return {
    saveCurrentData,
    loadYearData,
    getYears,
    isSaving,
    isLoading,
    isAuthenticated: !!user,
  };
};