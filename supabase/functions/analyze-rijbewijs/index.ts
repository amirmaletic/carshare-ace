import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Analyseert een rijbewijsscan met Lovable AI (Gemini) via tool calling
// en slaat de gestructureerde uitkomst op.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { verificatie_id } = await req.json()
    if (!verificatie_id) return json({ error: 'verificatie_id verplicht' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) return json({ error: 'AI niet geconfigureerd' }, 500)

    const { data: ver, error: verErr } = await supabase
      .from('rijbewijs_verificaties')
      .select('id, organisatie_id, klant_id, voorkant_pad, achterkant_pad')
      .eq('id', verificatie_id)
      .single()

    if (verErr || !ver || !ver.voorkant_pad || !ver.achterkant_pad) {
      return json({ error: 'Verificatie of scans niet gevonden' }, 404)
    }

    // Haal klant-naam voor naamcheck
    const { data: klant } = await supabase
      .from('klanten')
      .select('voornaam, achternaam, geboortedatum')
      .eq('id', ver.klant_id)
      .single()

    // Download beide foto's en converteer naar base64 data URLs
    const voorUrl = await getSignedDataUrl(supabase, ver.voorkant_pad)
    const achtUrl = await getSignedDataUrl(supabase, ver.achterkant_pad)

    // Roep Lovable AI aan met tool calling voor gestructureerde output
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content:
              'Je bent een expert in het analyseren van Nederlandse en Europese rijbewijzen. ' +
              'Lees de gegevens nauwkeurig uit de twee foto\'s (voorkant en achterkant). ' +
              'Beoordeel ook of de scan duidelijk leesbaar is en of het een echt rijbewijs lijkt ' +
              '(geen kopie van een kopie, geen scherm-foto, geen evidente manipulatie). ' +
              'Geef een confidence-score tussen 0 en 1.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyseer dit rijbewijs. Voorkant + achterkant volgen.' },
              { type: 'image_url', image_url: { url: voorUrl } },
              { type: 'image_url', image_url: { url: achtUrl } },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_rijbewijs',
              description: 'Geeft uitgelezen rijbewijs-gegevens en kwaliteitsoordeel terug.',
              parameters: {
                type: 'object',
                properties: {
                  voornaam: { type: 'string', description: 'Voornaam (alleen voornaam, geen tussenvoegsel)' },
                  achternaam: { type: 'string', description: 'Achternaam inclusief tussenvoegsels' },
                  geboortedatum: { type: 'string', description: 'Geboortedatum in formaat YYYY-MM-DD' },
                  rijbewijsnummer: { type: 'string', description: 'Documentnummer' },
                  categorieen: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Rijbewijscategorieën, bv ["AM","B","BE"]',
                  },
                  afgiftedatum: { type: 'string', description: 'Afgiftedatum in YYYY-MM-DD, of null' },
                  vervaldatum: { type: 'string', description: 'Vervaldatum in YYYY-MM-DD' },
                  is_leesbaar: { type: 'boolean', description: 'Foto duidelijk leesbaar' },
                  is_echt: { type: 'boolean', description: 'Lijkt op echt origineel rijbewijs (geen kopie)' },
                  confidence: { type: 'number', description: '0-1: hoe zeker ben je van de extractie' },
                  opmerkingen: { type: 'string', description: 'Korte uitleg of waarschuwingen' },
                },
                required: ['vervaldatum', 'is_leesbaar', 'is_echt', 'confidence'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_rijbewijs' } },
      }),
    })

    if (!aiResp.ok) {
      const errTxt = await aiResp.text()
      console.error('AI gateway error', aiResp.status, errTxt)
      if (aiResp.status === 429) return json({ error: 'AI rate limit, probeer later opnieuw' }, 429)
      if (aiResp.status === 402) return json({ error: 'AI credits ontbreken' }, 402)
      return json({ error: 'AI analyse mislukt' }, 500)
    }

    const aiData = await aiResp.json()
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0]
    if (!toolCall?.function?.arguments) {
      console.error('Geen tool call in AI response', JSON.stringify(aiData).slice(0, 500))
      return json({ error: 'AI gaf geen gestructureerd antwoord' }, 500)
    }

    const parsed = JSON.parse(toolCall.function.arguments)

    // Bepaal automatische status
    const today = new Date().toISOString().slice(0, 10)
    const verlopen = parsed.vervaldatum && parsed.vervaldatum < today
    const heeftCategorieB = Array.isArray(parsed.categorieen) && parsed.categorieen.includes('B')
    const naamMatch = checkNaamMatch(parsed, klant)
    const hoogConfident = (parsed.confidence ?? 0) >= 0.8

    let auto_status: 'goedgekeurd' | 'afgewezen' | 'ingediend' = 'ingediend'
    const notities: string[] = []

    if (!parsed.is_leesbaar) notities.push('Scan onvoldoende leesbaar')
    if (!parsed.is_echt) notities.push('Scan lijkt geen origineel')
    if (verlopen) notities.push(`Rijbewijs verlopen op ${parsed.vervaldatum}`)
    if (!heeftCategorieB) notities.push('Geen categorie B aanwezig')
    if (!naamMatch) notities.push(`Naam komt niet overeen met klantnaam (${klant?.voornaam} ${klant?.achternaam})`)
    if (parsed.opmerkingen) notities.push(parsed.opmerkingen)

    if (parsed.is_leesbaar && parsed.is_echt && !verlopen && heeftCategorieB && naamMatch && hoogConfident) {
      auto_status = 'goedgekeurd'
    } else if (!parsed.is_leesbaar || !parsed.is_echt || verlopen) {
      auto_status = 'afgewezen'
    } else {
      auto_status = 'ingediend' // wacht op handmatige check
    }

    const volledigeNaam = [parsed.voornaam, parsed.achternaam].filter(Boolean).join(' ').trim() || null

    const { error: updErr } = await supabase.rpc('update_rijbewijs_ai_resultaat', {
      _id: verificatie_id,
      _ai_naam: volledigeNaam,
      _ai_geboortedatum: parsed.geboortedatum || null,
      _ai_rijbewijsnummer: parsed.rijbewijsnummer || null,
      _ai_categorieen: parsed.categorieen || [],
      _ai_afgiftedatum: parsed.afgiftedatum || null,
      _ai_vervaldatum: parsed.vervaldatum || null,
      _ai_confidence: parsed.confidence ?? null,
      _ai_ruwe_data: parsed,
      _validatie_notities: notities.join('. ') || null,
      _auto_status: auto_status,
    })

    if (updErr) {
      console.error('Update error', updErr)
      return json({ error: updErr.message }, 500)
    }

    return json({ success: true, auto_status, notities })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Onbekende fout' }, 500)
  }
})

async function getSignedDataUrl(supabase: any, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('rijbewijzen').download(path)
  if (error || !data) throw new Error(`Kan ${path} niet downloaden`)
  const buf = new Uint8Array(await data.arrayBuffer())
  let bin = ''
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i])
  const b64 = btoa(bin)
  const mime = data.type || 'image/jpeg'
  return `data:${mime};base64,${b64}`
}

function checkNaamMatch(ai: any, klant: any): boolean {
  if (!klant) return true
  const aiVoor = (ai.voornaam || '').toLowerCase().trim()
  const aiAcht = (ai.achternaam || '').toLowerCase().trim()
  const kVoor = (klant.voornaam || '').toLowerCase().trim()
  const kAcht = (klant.achternaam || '').toLowerCase().trim()
  if (!aiVoor && !aiAcht) return false
  // Soepel: voornaam OF achternaam moet matchen (op substring)
  return (
    (aiVoor && (kVoor.includes(aiVoor) || aiVoor.includes(kVoor))) ||
    (aiAcht && (kAcht.includes(aiAcht) || aiAcht.includes(kAcht)))
  )
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}