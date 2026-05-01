import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PUBLIC_BASE_URL = 'https://fleeflo.nl'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { verificatie_id, contract_id, is_herinnering } = await req.json()
    if (!verificatie_id && !contract_id) {
      return json({ error: 'verificatie_id of contract_id is verplicht' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Haal verificatie op, of maak hem aan vanuit contract_id
    let ver: any = null
    if (verificatie_id) {
      const { data } = await supabase
        .from('rijbewijs_verificaties')
        .select('id, upload_token, token_expires_at, klant_id, organisatie_id')
        .eq('id', verificatie_id)
        .maybeSingle()
      ver = data
    }
    if (!ver && contract_id) {
      // Bestaande verificatie op contract?
      const { data: bestaand } = await supabase
        .from('rijbewijs_verificaties')
        .select('id, upload_token, token_expires_at, klant_id, organisatie_id')
        .eq('contract_id', contract_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (bestaand) {
        ver = bestaand
      } else {
        // Bouw nieuw record op basis van contract
        const { data: contract, error: cErr } = await supabase
          .from('contracts')
          .select('id, organisatie_id, klant_naam, klant_email, klant_telefoon')
          .eq('id', contract_id)
          .maybeSingle()
        if (cErr || !contract) return json({ error: 'Contract niet gevonden' }, 404)

        let { data: klantRec } = await supabase
          .from('klanten')
          .select('id')
          .eq('organisatie_id', contract.organisatie_id)
          .ilike('email', contract.klant_email)
          .maybeSingle()
        if (!klantRec) {
          const parts = (contract.klant_naam || '').trim().split(/\s+/)
          const voornaam = parts[0] || 'Klant'
          const achternaam = parts.length > 1 ? parts.slice(1).join(' ') : '-'
          const { data: nieuweKlant, error: kErr } = await supabase
            .from('klanten')
            .insert({
              organisatie_id: contract.organisatie_id,
              voornaam,
              achternaam,
              email: (contract.klant_email || '').toLowerCase().trim(),
              telefoon: contract.klant_telefoon ?? null,
              type: 'particulier',
            })
            .select('id')
            .single()
          if (kErr || !nieuweKlant) return json({ error: kErr?.message || 'Kon klant niet aanmaken' }, 500)
          klantRec = nieuweKlant
        }

        const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
        const { data: nieuw, error: nErr } = await supabase
          .from('rijbewijs_verificaties')
          .insert({
            organisatie_id: contract.organisatie_id,
            klant_id: klantRec.id,
            contract_id: contract.id,
            upload_token: token,
            status: 'in_afwachting',
          })
          .select('id, upload_token, token_expires_at, klant_id, organisatie_id')
          .single()
        if (nErr || !nieuw) return json({ error: nErr?.message || 'Kon verificatie niet aanmaken' }, 500)
        ver = nieuw
      }
    }
    if (!ver) return json({ error: 'Verificatie niet gevonden' }, 404)

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
      .eq('id', ver.id)

    return json({ success: true, verificatie_id: ver.id })
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