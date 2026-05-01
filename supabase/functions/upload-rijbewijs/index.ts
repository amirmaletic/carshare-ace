import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Publieke endpoint: klant uploadt rijbewijs zonder login via token.
// Ontvangt JSON met token + base64-encoded foto's, slaat op in storage en triggert AI-analyse.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { token, voorkant_base64, achterkant_base64, voorkant_mime, achterkant_mime } = body

    if (!token || !voorkant_base64 || !achterkant_base64) {
      return json({ error: 'Token, voorkant en achterkant zijn verplicht' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Valideer token + haal verificatie op
    const { data: ver, error: verErr } = await supabase
      .from('rijbewijs_verificaties')
      .select('id, organisatie_id, status, token_expires_at')
      .eq('upload_token', token)
      .maybeSingle()

    if (verErr || !ver) {
      return json({ error: 'Ongeldig token' }, 404)
    }
    if (new Date(ver.token_expires_at) < new Date()) {
      return json({ error: 'Deze link is verlopen' }, 410)
    }
    if (!['in_afwachting', 'afgewezen'].includes(ver.status)) {
      return json({ error: 'Deze verificatie kan niet meer worden gewijzigd' }, 409)
    }

    // Decodeer en upload
    const voorExt = mimeToExt(voorkant_mime)
    const achtExt = mimeToExt(achterkant_mime)
    const voorPad = `${ver.organisatie_id}/${ver.id}/voorkant.${voorExt}`
    const achtPad = `${ver.organisatie_id}/${ver.id}/achterkant.${achtExt}`

    const voorBytes = base64ToBytes(voorkant_base64)
    const achtBytes = base64ToBytes(achterkant_base64)

    if (voorBytes.length > 8 * 1024 * 1024 || achtBytes.length > 8 * 1024 * 1024) {
      return json({ error: 'Foto te groot (max 8MB per zijde)' }, 413)
    }

    const { error: upErr1 } = await supabase.storage
      .from('rijbewijzen')
      .upload(voorPad, voorBytes, { contentType: voorkant_mime || 'image/jpeg', upsert: true })
    if (upErr1) {
      console.error('Upload voorkant error', upErr1)
      return json({ error: 'Upload voorkant mislukt' }, 500)
    }

    const { error: upErr2 } = await supabase.storage
      .from('rijbewijzen')
      .upload(achtPad, achtBytes, { contentType: achterkant_mime || 'image/jpeg', upsert: true })
    if (upErr2) {
      console.error('Upload achterkant error', upErr2)
      return json({ error: 'Upload achterkant mislukt' }, 500)
    }

    // Markeer als ingediend
    const { error: rpcErr } = await supabase.rpc('markeer_rijbewijs_ingediend', {
      _token: token,
      _voorkant_pad: voorPad,
      _achterkant_pad: achtPad,
    })
    if (rpcErr) {
      console.error('RPC error', rpcErr)
      return json({ error: rpcErr.message }, 500)
    }

    // Trigger AI-analyse asynchroon (we wachten niet)
    supabase.functions.invoke('analyze-rijbewijs', {
      body: { verificatie_id: ver.id },
    }).catch((e) => console.error('AI invoke error', e))

    return json({ success: true, verificatie_id: ver.id })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Onbekende fout' }, 500)
  }
})

function mimeToExt(mime?: string): string {
  if (!mime) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('heic')) return 'heic'
  return 'jpg'
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.includes(',') ? b64.split(',')[1] : b64
  const bin = atob(cleaned)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}