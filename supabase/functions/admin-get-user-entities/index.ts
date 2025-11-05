// Supabase Edge Function per ottenere gli enti e anni di un utente
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token di autorizzazione mancante' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token non valido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Solo gli amministratori possono visualizzare gli enti degli utenti' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID utente mancante' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ottieni gli enti dell'utente
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('id, name, tipologia, numero_abitanti, created_at')
      .eq('user_id', userId)
      .order('name')

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      return new Response(
        JSON.stringify({ error: 'Errore durante il caricamento degli enti' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Per ogni entità, ottieni gli anni disponibili
    const entitiesWithYears = await Promise.all(
      (entities || []).map(async (entity) => {
        const { data: years, error: yearsError } = await supabase
          .from('annual_entries')
          .select('year')
          .eq('entity_id', entity.id)
          .eq('user_id', userId)
          .order('year', { ascending: false })

        if (yearsError) {
          console.error(`Error fetching years for entity ${entity.id}:`, yearsError)
          return { ...entity, years: [] }
        }

        return {
          ...entity,
          years: (years || []).map(y => y.year)
        }
      })
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        entities: entitiesWithYears,
        totalEntities: entitiesWithYears.length,
        totalYears: entitiesWithYears.reduce((sum, e) => sum + e.years.length, 0)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-get-user-entities:', error)
    return new Response(
      JSON.stringify({ error: 'Errore interno del server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
