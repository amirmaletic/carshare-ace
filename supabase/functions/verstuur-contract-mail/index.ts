import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const RESEND_GATEWAY = 'https://connector-gateway.lovable.dev/resend'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) throw new Error('Resend connector niet geconfigureerd')

    const auth = req.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    })
    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const body = await req.json().catch(() => ({}))
    const { contract_id, contract_pdf_base64 } = body as { contract_id?: string; contract_pdf_base64?: string }
    if (!contract_id || !contract_pdf_base64) {
      return new Response(JSON.stringify({ error: 'contract_id en contract_pdf_base64 vereist' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // Contract ophalen via user-client (RLS check)
    const { data: contract, error: cErr } = await userClient
      .from('contracts')
      .select('id, contract_nummer, klant_email, klant_naam, organisatie_id')
      .eq('id', contract_id)
      .maybeSingle()
    if (cErr || !contract) {
      return new Response(JSON.stringify({ error: 'Contract niet gevonden' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!contract.klant_email) {
      return new Response(JSON.stringify({ error: 'Klant heeft geen e-mailadres' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Org info + AV pad
    const { data: org } = await admin
      .from('organisaties')
      .select('naam, algemene_voorwaarden_pad, email')
      .eq('id', contract.organisatie_id)
      .maybeSingle()

    const orgNaam = org?.naam ?? 'Verhuurder'

    const attachments: Array<{ filename: string; content: string }> = [
      {
        filename: `huurcontract-${contract.contract_nummer}.pdf`,
        content: contract_pdf_base64,
      },
    ]

    if (org?.algemene_voorwaarden_pad) {
      const { data: avFile, error: avErr } = await admin.storage
        .from('organisatie-documenten')
        .download(org.algemene_voorwaarden_pad)
      if (!avErr && avFile) {
        const buf = new Uint8Array(await avFile.arrayBuffer())
        // base64 encode
        let binary = ''
        for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i])
        attachments.push({
          filename: 'algemene-voorwaarden.pdf',
          content: btoa(binary),
        })
      } else {
        console.warn('AV download mislukt:', avErr?.message)
      }
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2 style="color:#3B82F6;margin:0 0 12px;">Uw huurcontract is rond</h2>
        <p>Beste ${contract.klant_naam ?? 'klant'},</p>
        <p>Bij deze mail vindt u uw ondertekende huurcontract <strong>${contract.contract_nummer}</strong>${org?.algemene_voorwaarden_pad ? ' en de bijbehorende algemene voorwaarden' : ''} als bijlage.</p>
        <p>Bewaar dit document zorgvuldig. U kunt ook altijd inloggen op het klantportaal voor uw documenten.</p>
        <p style="margin-top:24px;">Met vriendelijke groet,<br/>${orgNaam}</p>
      </div>
    `

    const resendRes = await fetch(`${RESEND_GATEWAY}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `${orgNaam} <noreply@notify.fleeflo.nl>`,
        to: [contract.klant_email],
        subject: `Uw huurcontract ${contract.contract_nummer}`,
        html,
        attachments,
      }),
    })
    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      console.error('Resend fout:', resendData)
      throw new Error(`Resend [${resendRes.status}]: ${JSON.stringify(resendData)}`)
    }

    // Activiteiten log
    await admin.from('activiteiten_log').insert({
      organisatie_id: contract.organisatie_id,
      gebruiker_id: userData.user.id,
      actie: 'contract_mail_verzonden',
      entiteit_type: 'contract',
      entiteit_id: contract.id,
      details: { naar: contract.klant_email, met_av: attachments.length > 1 },
    }).then(() => {}, () => {})

    return new Response(JSON.stringify({ success: true, message_id: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error(e)
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})