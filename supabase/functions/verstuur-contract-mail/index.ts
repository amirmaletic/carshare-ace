import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { jsPDF } from 'npm:jspdf@2.5.1'

function fmtDate(d?: string | null) {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return d }
}
function money(n: number | string | null | undefined) {
  return `EUR ${Number(n ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any)
  }
  return btoa(binary)
}

function buildContractPdfBase64(input: {
  orgNaam: string
  contract: any
  vehicle: any | null
}): string {
  const { orgNaam, contract, vehicle } = input
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 56
  const left = 48
  const right = pageWidth - 48

  // Header band
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 8, 'F')

  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(15, 23, 42)
  doc.text(orgNaam, left, y)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(100, 116, 139)
  doc.text('Huurcontract', left, y + 16)

  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(15, 23, 42)
  doc.text(`Contract ${contract.contract_nummer ?? ''}`, right, y, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(100, 116, 139)
  doc.text(`Datum: ${fmtDate(new Date().toISOString())}`, right, y + 14, { align: 'right' })

  y += 44
  doc.setDrawColor(226, 232, 240).line(left, y, right, y)
  y += 24

  const section = (title: string) => {
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(59, 130, 246)
    doc.text(title.toUpperCase(), left, y)
    y += 6
    doc.setDrawColor(226, 232, 240).line(left, y, right, y)
    y += 16
  }
  const row = (label: string, value: string | null | undefined) => {
    if (y > 760) { doc.addPage(); y = 56 }
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(100, 116, 139)
    doc.text(label, left, y)
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(15, 23, 42)
    doc.text(String(value ?? '-'), left + 140, y, { maxWidth: right - left - 140 })
    y += 18
  }

  section('Contractgegevens')
  row('Type', contract.type)
  row('Status', contract.status)
  row('Startdatum', fmtDate(contract.start_datum))
  row('Einddatum', fmtDate(contract.eind_datum))
  if (contract.maandprijs) row('Maandprijs', money(contract.maandprijs))
  if (contract.dagprijs) row('Dagprijs', money(contract.dagprijs))
  if (Number(contract.borg) > 0) row('Borg', money(contract.borg))
  if (contract.km_per_jaar) row('Km per jaar', `${contract.km_per_jaar} km`)

  y += 8
  section('Klantgegevens')
  row('Naam', contract.klant_naam)
  row('E-mail', contract.klant_email)
  if (contract.klant_telefoon) row('Telefoon', contract.klant_telefoon)
  if (contract.klant_adres) row('Adres', contract.klant_adres)
  if (contract.bedrijf) row('Bedrijf', contract.bedrijf)
  if (contract.kvk_nummer) row('KVK-nummer', contract.kvk_nummer)

  if (vehicle) {
    y += 8
    section('Voertuig')
    row('Merk en model', `${vehicle.merk ?? ''} ${vehicle.model ?? ''}`.trim())
    row('Kenteken', vehicle.kenteken)
    if (vehicle.bouwjaar) row('Bouwjaar', String(vehicle.bouwjaar))
    if (vehicle.brandstof) row('Brandstof', vehicle.brandstof)
    if (vehicle.categorie) row('Categorie', vehicle.categorie)
  }

  if (Array.isArray(contract.inclusief) && contract.inclusief.length > 0) {
    y += 8
    section('Inbegrepen services')
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(15, 23, 42)
    const text = contract.inclusief.join(', ')
    const split = doc.splitTextToSize(text, right - left)
    doc.text(split, left, y)
    y += split.length * 14
  }

  if (contract.notities) {
    y += 8
    section('Bijzonderheden')
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(15, 23, 42)
    const split = doc.splitTextToSize(contract.notities, right - left)
    doc.text(split, left, y)
    y += split.length * 14
  }

  // Signatures
  if (y > 660) { doc.addPage(); y = 56 }
  y = Math.max(y + 32, 700)
  const colW = (right - left - 40) / 2
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(100, 116, 139)
  doc.text('Verhuurder', left, y)
  doc.text('Huurder', left + colW + 40, y)
  doc.setDrawColor(15, 23, 42)
  doc.line(left, y + 40, left + colW, y + 40)
  doc.line(left + colW + 40, y + 40, right, y + 40)
  doc.setFontSize(10).setTextColor(15, 23, 42)
  doc.text(orgNaam, left, y + 56)
  doc.text(contract.klant_naam ?? '', left + colW + 40, y + 56)

  // Footer
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(148, 163, 184)
  doc.text(`Gegenereerd op ${fmtDate(new Date().toISOString())} - ${contract.contract_nummer ?? ''}`, pageWidth / 2, 820, { align: 'center' })

  const arr = doc.output('arraybuffer') as ArrayBuffer
  return bytesToBase64(new Uint8Array(arr))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const auth = req.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    })
    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const body = await req.json().catch(() => ({}))
    const { contract_id } = body as { contract_id?: string }
    if (!contract_id) {
      return new Response(JSON.stringify({ error: 'contract_id vereist' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // Contract ophalen via user-client (RLS check), dan volledig via admin
    const { data: contract, error: cErr } = await userClient
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .maybeSingle()
    if (cErr || !contract) {
      return new Response(JSON.stringify({ error: 'Contract niet gevonden' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!contract.klant_email) {
      return new Response(JSON.stringify({ error: 'Klant heeft geen e-mailadres' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let vehicle: any = null
    if (contract.voertuig_id) {
      const { data } = await admin.from('voertuigen').select('merk, model, kenteken, bouwjaar, brandstof, categorie').eq('id', contract.voertuig_id).maybeSingle()
      vehicle = data
    }

    // Org info + AV pad
    const { data: org } = await admin
      .from('organisaties')
      .select('naam, algemene_voorwaarden_pad, email')
      .eq('id', contract.organisatie_id)
      .maybeSingle()

    const orgNaam = org?.naam ?? 'Verhuurder'

    const contractPdfBase64 = buildContractPdfBase64({ orgNaam, contract, vehicle })
    // Upload contract-PDF naar storage en maak signed URL (30 dagen)
    const pdfBytes = Uint8Array.from(atob(contractPdfBase64), (c) => c.charCodeAt(0))
    const pdfPath = `contracten/${contract.organisatie_id}/${contract.id}-${Date.now()}.pdf`
    const { error: upErr } = await admin.storage
      .from('organisatie-documenten')
      .upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true })
    if (upErr) throw new Error(`Upload mislukt: ${upErr.message}`)

    const EXPIRES = 60 * 60 * 24 * 30 // 30 dagen
    const { data: signed, error: signErr } = await admin.storage
      .from('organisatie-documenten')
      .createSignedUrl(pdfPath, EXPIRES)
    if (signErr || !signed?.signedUrl) throw new Error(`Signed URL mislukt: ${signErr?.message}`)
    const contract_url = signed.signedUrl

    let av_url: string | null = null
    if (org?.algemene_voorwaarden_pad) {
      const { data: avSigned } = await admin.storage
        .from('organisatie-documenten')
        .createSignedUrl(org.algemene_voorwaarden_pad, EXPIRES)
      av_url = avSigned?.signedUrl ?? null
    }

    // Verstuur via Resend (connector gateway)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY ontbreekt')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY ontbreekt (Resend connector niet gekoppeld)')

    // fleeflo.nl is geverifieerd in Resend.
    const RESEND_FROM = Deno.env.get('RESEND_FROM') || `${orgNaam} <noreply@fleeflo.nl>`
    const fromAddress = RESEND_FROM
    const replyTo = org?.email || undefined
    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#3b82f6;margin:0 0 12px">Uw huurcontract</h2>
        <p>Beste ${contract.klant_naam ?? 'klant'},</p>
        <p>In de bijlage vindt u uw huurcontract${contract.contract_nummer ? ` <strong>${contract.contract_nummer}</strong>` : ''} van ${orgNaam}.</p>
        <p>U kunt het contract ook online bekijken via <a href="${contract_url}" style="color:#3b82f6">deze link</a>.</p>
        ${av_url ? `<p>Onze algemene voorwaarden vindt u <a href="${av_url}" style="color:#3b82f6">hier</a>.</p>` : ''}
        <p style="margin-top:24px">Met vriendelijke groet,<br/>${orgNaam}</p>
      </div>
    `

    const sendResp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [contract.klant_email],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `Uw huurcontract${contract.contract_nummer ? ` ${contract.contract_nummer}` : ''} - ${orgNaam}`,
        html,
        attachments: [
          {
            filename: `contract-${contract.contract_nummer ?? contract.id}.pdf`,
            content: contractPdfBase64,
          },
        ],
      }),
    })
    const sendText = await sendResp.text()
    if (!sendResp.ok) {
      console.error('Resend failed', sendResp.status, sendText)
      throw new Error(`Resend [${sendResp.status}]: ${sendText}`)
    }
    let sendRes: any = null
    try { sendRes = JSON.parse(sendText) } catch { sendRes = sendText }

    // Activiteiten log
    await admin.from('activiteiten_log').insert({
      organisatie_id: contract.organisatie_id,
      gebruiker_id: userData.user.id,
      actie: 'contract_mail_verzonden',
      entiteit_type: 'contract',
      entiteit_id: contract.id,
      details: { naar: contract.klant_email, met_av: !!av_url, pdf_pad: pdfPath },
    }).then(() => {}, () => {})

    return new Response(JSON.stringify({ success: true, contract_url, av_url, send: sendRes }), {
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