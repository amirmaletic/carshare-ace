import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PUBLIC_BASE_URL = 'https://fleeflo.nl'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { verificatie_id, is_herinnering } = await req.json()
    if (!verificatie_id) {
      return json({ error: 'verificatie_id is verplicht' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Haal verificatie op met klant- en organisatie-info
    const { data: ver, error: verErr } = await supabase
      .from('rijbewijs_verificaties')
      .select('id, upload_token, token_expires_at, klant_id, organisatie_id')
      .eq('id', verificatie_id)
      .single()

    if (verErr || !ver) {
      return json({ error: 'Verificatie niet gevonden' }, 404)
    }

    const { data: klant } = await supabase
      .from('klanten')
      .select('voornaam, achternaam, email')
      .eq('id', ver.klant_id)
      .single()

    const { data: org } = await supabase
      .from('organisaties')
      .select('naam')
      .eq('id', ver.organisatie_id)
      .single()

    if (!klant?.email) {
      return json({ error: 'Klant heeft geen e-mailadres' }, 400)
    }

    const uploadUrl = `${PUBLIC_BASE_URL}/rijbewijs/${ver.upload_token}`
    const vervaltOp = new Date(ver.token_expires_at).toLocaleDateString('nl-NL', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    // Roep send-transactional-email aan
    const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'rijbewijs-verzoek',
        recipientEmail: klant.email,
        templateData: {
          klantNaam: `${klant.voornaam} ${klant.achternaam}`.trim(),
          organisatieNaam: org?.naam ?? 'FleeFlo',
          uploadUrl,
          vervaltOp,
          isHerinnering: !!is_herinnering,
        },
      },
    })

    if (sendErr) {
      console.error('Email send error', sendErr)
      return json({ error: 'E-mail versturen mislukt' }, 500)
    }

    // Update tijdstempel
    const updateField = is_herinnering ? 'herinnering_verzonden_op' : 'email_verzonden_op'
    await supabase
      .from('rijbewijs_verificaties')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', verificatie_id)

    return json({ success: true })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Onbekende fout' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}