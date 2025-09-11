// Supabase Edge Function per creare utenti in modo sicuro
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifica autorizzazione JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token di autorizzazione mancante' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crea client Supabase per validare il token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verifica che il token sia valido e appartenga a un admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token non valido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Controlla se l'utente è admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Solo gli amministratori possono creare utenti' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Estrai i dati della richiesta
    const { email, password, full_name } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e password sono obbligatori' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crea l'utente usando il service role
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        full_name: full_name || ''
      },
      email_confirm: true
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: `Errore nella creazione dell'account: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userData.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Utente creato ma ID non disponibile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crea il profilo
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: email,
        full_name: full_name || '',
        role: 'user'
      })

    if (profileInsertError) {
      // Se il profilo fallisce, elimina l'utente appena creato
      await supabase.auth.admin.deleteUser(userData.user.id)
      return new Response(
        JSON.stringify({ error: `Errore nella creazione del profilo: ${profileInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: userData.user.id,
        message: 'Utente creato con successo'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-create-user:', error)
    return new Response(
      JSON.stringify({ error: 'Errore interno del server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})