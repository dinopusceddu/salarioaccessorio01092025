// services/database.ts - Service layer per interagire con il database Supabase
import { supabase } from '../lib/supabaseClient';
import { FundData } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  full_name?: string;
  created_at: string;
}

export interface AnnualEntry {
  id: string;
  user_id: string;
  year: number;
  data: FundData;
  created_at: string;
  updated_at: string;
}

export interface AdminEntryView extends AnnualEntry {
  profile: {
    email: string;
    full_name?: string;
  };
}

export class DatabaseService {
  
  /**
   * Crea o aggiorna il profilo dell'utente corrente
   */
  static async ensureProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Prima prova a ottenere il profilo esistente
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // Se non esiste, crealo
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email || '',
          role: 'user'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return null;
      }

      return newProfile;
    } catch (error) {
      console.error('Error in ensureProfile:', error);
      return null;
    }
  }

  /**
   * Ottieni il profilo dell'utente corrente
   */
  static async getProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Se il profilo non esiste, prova a crearlo
        if (error.code === 'PGRST116') {
          return await this.ensureProfile();
        }
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  }

  /**
   * Ottieni il ruolo dell'utente corrente
   */
  static async getUserRole(): Promise<'user' | 'admin' | null> {
    const profile = await this.getProfile();
    return profile?.role || null;
  }

  /**
   * Verifica se l'utente corrente è admin
   */
  static async isAdmin(): Promise<boolean> {
    const role = await this.getUserRole();
    return role === 'admin';
  }

  /**
   * Ottieni tutti gli anni per cui l'utente ha dati salvati
   */
  static async getAvailableYears(): Promise<number[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('annual_entries')
        .select('year')
        .eq('user_id', user.id)
        .order('year', { ascending: false });

      if (error) {
        console.error('Error fetching available years:', error);
        return [];
      }

      return data.map(entry => entry.year);
    } catch (error) {
      console.error('Error in getAvailableYears:', error);
      return [];
    }
  }

  /**
   * Ottieni i dati per un anno specifico
   */
  static async getAnnualEntry(year: number): Promise<FundData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('annual_entries')
        .select('data')
        .eq('user_id', user.id)
        .eq('year', year)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found for this year
          return null;
        }
        console.error('Error fetching annual entry:', error);
        return null;
      }

      return data.data as FundData;
    } catch (error) {
      console.error('Error in getAnnualEntry:', error);
      return null;
    }
  }

  /**
   * Salva o aggiorna i dati per un anno specifico
   */
  static async upsertAnnualEntry(year: number, data: FundData): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      const { error } = await supabase
        .from('annual_entries')
        .upsert({
          user_id: user.id,
          year: year,
          data: data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,year'
        });

      if (error) {
        console.error('Error upserting annual entry:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in upsertAnnualEntry:', error);
      return false;
    }
  }

  /**
   * Elimina i dati per un anno specifico
   */
  static async deleteAnnualEntry(year: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { error } = await supabase
        .from('annual_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('year', year);

      if (error) {
        console.error('Error deleting annual entry:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAnnualEntry:', error);
      return false;
    }
  }

  /**
   * [SOLO ADMIN] Ottieni tutti gli inserimenti di tutti gli utenti
   */
  static async getAllEntries(): Promise<AdminEntryView[]> {
    try {
      const { data, error } = await supabase
        .from('annual_entries')
        .select(`
          *,
          profile:profiles!annual_entries_user_id_fkey (
            email,
            full_name
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching all entries:', error);
        return [];
      }

      return data as AdminEntryView[];
    } catch (error) {
      console.error('Error in getAllEntries:', error);
      return [];
    }
  }

  /**
   * [SOLO ADMIN] Ottieni tutti gli utenti registrati
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }

      return data as UserProfile[];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  /**
   * [SOLO ADMIN] Aggiorna il ruolo di un utente
   */
  static async updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return false;
    }
  }

  /**
   * [SOLO ADMIN] Crea un nuovo utente con email e password
   * NOTA: Questa funzione richiede Edge Functions per la sicurezza
   */
  static async createUser(email: string, password: string, fullName?: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Verifica che l'utente corrente sia admin
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        return { success: false, error: 'Solo gli amministratori possono creare utenti' };
      }

      // TODO: Implementare Edge Function per sicurezza
      return { 
        success: false, 
        error: 'Funzionalità temporaneamente disabilitata. Usa il Supabase Dashboard per creare utenti manualmente.' 
      };
    } catch (error) {
      console.error('Error in createUser:', error);
      return { success: false, error: 'Errore interno del server' };
    }
  }

  /**
   * [SOLO ADMIN] Elimina un utente
   * NOTA: Questa funzione richiede Edge Functions per la sicurezza
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // Verifica che l'utente corrente sia admin
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        console.error('Solo gli amministratori possono eliminare utenti');
        return false;
      }

      // TODO: Implementare Edge Function per sicurezza
      console.error('Funzionalità temporaneamente disabilitata. Usa il Supabase Dashboard per eliminare utenti.');
      return false;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return false;
    }
  }
}