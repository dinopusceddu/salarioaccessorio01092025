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

export interface Entity {
  id: string;
  user_id: string;
  name: string;
  tipologia?: string;
  altro_tipologia?: string;
  numero_abitanti?: number;
  created_at: string;
  updated_at: string;
}

export interface AnnualEntry {
  id: string;
  user_id: string;
  entity_id: string;
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
      console.log('🔄 ensureProfile: Starting...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔄 ensureProfile: getUser result:', { userExists: !!user, userError });
      
      if (!user) {
        console.log('❌ ensureProfile: No user from getUser()');
        return null;
      }

      console.log('🔍 Loading profile for user ID:', user.id);

      // Prima prova a ottenere il profilo esistente
      console.log('🔄 ensureProfile: About to query profiles table...');
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('📋 Profile query result:', { existingProfile, fetchError });

      if (existingProfile) {
        console.log('✅ Found existing profile with role:', existingProfile.role);
        return existingProfile;
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ ensureProfile: Fetch error (not missing record):', fetchError);
        return null;
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

  // =============
  // ENTITY METHODS
  // =============

  /**
   * Lista tutte le entità dell'utente corrente
   */
  static async listEntities(): Promise<Entity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching entities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in listEntities:', error);
      return [];
    }
  }

  /**
   * Ottieni una singola entità per ID
   */
  static async getEntity(entityId: string): Promise<Entity | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('id', entityId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching entity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getEntity:', error);
      return null;
    }
  }

  /**
   * Crea una nuova entità per l'utente corrente
   */
  static async createEntity(entity: {
    name: string;
    tipologia?: string;
    altro_tipologia?: string;
    numero_abitanti?: number;
  }): Promise<{ success: boolean; entity?: Entity; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utente non autenticato' };
      }

      // Controlla se esiste già un'entità con lo stesso nome (case insensitive)
      const { data: existing } = await supabase
        .from('entities')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', entity.name);

      if (existing && existing.length > 0) {
        return { success: false, error: 'Esiste già un\'entità con questo nome' };
      }

      const { data, error } = await supabase
        .from('entities')
        .insert({
          user_id: user.id,
          name: entity.name,
          tipologia: entity.tipologia,
          altro_tipologia: entity.altro_tipologia,
          numero_abitanti: entity.numero_abitanti
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating entity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, entity: data };
    } catch (error) {
      console.error('Error in createEntity:', error);
      return { success: false, error: 'Errore interno' };
    }
  }

  /**
   * Aggiorna un'entità esistente
   */
  static async updateEntity(entityId: string, updates: {
    name?: string;
    tipologia?: string;
    altro_tipologia?: string;
    numero_abitanti?: number;
  }): Promise<{ success: boolean; entity?: Entity; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utente non autenticato' };
      }

      // Se viene cambiato il nome, controlla che non esista già
      if (updates.name) {
        const { data: existing } = await supabase
          .from('entities')
          .select('id')
          .eq('user_id', user.id)
          .ilike('name', updates.name)
          .neq('id', entityId);

        if (existing && existing.length > 0) {
          return { success: false, error: 'Esiste già un\'entità con questo nome' };
        }
      }

      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', entityId)
        .eq('user_id', user.id) // Sicurezza: solo proprie entità
        .select()
        .single();

      if (error) {
        console.error('Error updating entity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, entity: data };
    } catch (error) {
      console.error('Error in updateEntity:', error);
      return { success: false, error: 'Errore interno' };
    }
  }

  /**
   * Elimina un'entità e tutti i suoi dati annuali
   */
  static async deleteEntity(entityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utente non autenticato' };
      }

      // Prima elimina tutti gli annual_entries collegati
      const { error: entriesError } = await supabase
        .from('annual_entries')
        .delete()
        .eq('entity_id', entityId)
        .eq('user_id', user.id);

      if (entriesError) {
        console.error('Error deleting annual entries:', entriesError);
        return { success: false, error: 'Errore durante l\'eliminazione dei dati annuali' };
      }

      // Poi elimina l'entità
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting entity:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteEntity:', error);
      return { success: false, error: 'Errore interno' };
    }
  }

  /**
   * Verifica se l'utente corrente è admin
   */
  static async isAdmin(): Promise<boolean> {
    const role = await this.getUserRole();
    return role === 'admin';
  }

  /**
   * Ottieni tutti gli anni per cui l'utente ha dati salvati per un'entità
   */
  static async getAvailableYears(entityId: string): Promise<number[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('annual_entries')
        .select('year')
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
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
   * Ottieni i dati per un'entità e anno specifici
   */
  static async getAnnualEntry(entityId: string, year: number): Promise<FundData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('annual_entries')
        .select('data')
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .eq('year', year)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found for this entity/year
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
   * Salva o aggiorna i dati per un'entità e anno specifici
   */
  static async upsertAnnualEntry(entityId: string, year: number, data: FundData): Promise<boolean> {
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
          entity_id: entityId,
          year: year,
          data: data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,entity_id,year'
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
   * Elimina i dati per un'entità e anno specifici
   */
  static async deleteAnnualEntry(entityId: string, year: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { error } = await supabase
        .from('annual_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
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
   * [ADMIN ONLY] Ottieni tutti gli inserimenti di tutti gli utenti
   * Ora sicuro con RLS - admin può vedere tutti i dati via policy
   */
  static async getAllEntries(): Promise<AdminEntryView[]> {
    try {
      // Verifica che l'utente corrente sia admin
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        console.log('❌ getAllEntries: Access denied - not admin');
        return [];
      }

      const { data, error } = await supabase
        .from('annual_entries')
        .select(`
          *,
          profile:profiles!annual_entries_user_id_fkey (
            email,
            full_name
          ),
          entity:entities!annual_entries_entity_id_fkey (
            name,
            tipologia
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
   * [SOLO ADMIN] Ottieni tutti gli utenti registrati via Edge Function
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      console.log('🔍 getAllUsers: Starting query via Edge Function...');
      
      // Verifica che l'utente corrente sia admin
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        console.log('❌ getAllUsers: Not admin, returning empty array');
        return [];
      }

      // Ottieni il token di autorizzazione dell'admin corrente
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('❌ getAllUsers: No valid admin session');
        return [];
      }

      // Chiama l'Edge Function per ottenere tutti i profili con service role
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('❌ getAllUsers: Edge Function error:', response.status);
          // Fallback alla query normale se Edge Function non disponibile
          return this.getAllUsersFallback();
        }

        const result = await response.json();
        console.log('✅ getAllUsers: Found users via Edge Function:', result.users?.length || 0, result.users);
        return result.users || [];
      } catch (fetchError) {
        console.warn('⚠️ getAllUsers: Edge Function not available, using fallback');
        return this.getAllUsersFallback();
      }
    } catch (error) {
      console.error('❌ getAllUsers: Exception:', error);
      return [];
    }
  }

  /**
   * Fallback method per getAllUsers quando Edge Function non disponibile
   */
  private static async getAllUsersFallback(): Promise<UserProfile[]> {
    try {
      console.log('🔄 getAllUsers: Using fallback method...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ getAllUsers fallback: Error fetching users:', error);
        return [];
      }

      console.log('✅ getAllUsers fallback: Found users:', data?.length || 0, data);
      return data as UserProfile[];
    } catch (error) {
      console.error('❌ getAllUsers fallback: Exception:', error);
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

      console.log('📝 Creating new user via Edge Function:', email);

      // Ottieni il token di autorizzazione dell'admin corrente
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { 
          success: false, 
          error: 'Sessione admin non valida' 
        };
      }

      // Chiama l'Edge Function per creare l'utente in modo sicuro
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            password: password,
            full_name: fullName || ''
          })
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('❌ Edge Function error:', result);
          return { 
            success: false, 
            error: result.error || 'Errore nella creazione dell\'utente' 
          };
        }

        console.log('✅ User created successfully via Edge Function');
        return { 
          success: true, 
          userId: result.userId 
        };
      } catch (fetchError) {
        console.error('❌ Network error calling Edge Function:', fetchError);
        return { 
          success: false, 
          error: 'Errore di rete - Edge Function non disponibile. Contatta l\'amministratore di sistema.' 
        };
      }
    } catch (error) {
      console.error('❌ Error in createUser:', error);
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