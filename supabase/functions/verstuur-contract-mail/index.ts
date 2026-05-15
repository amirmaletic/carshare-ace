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
  schades?: any[]
  org?: any
}): string {
  const { orgNaam, contract, vehicle, schades = [], org } = input
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const left = 48
  const right = pageWidth - 48
  const contentW = right - left
  let y = 0

  // Brand colors
  const BRAND: [number, number, number] = [59, 130, 246]
  const INK: [number, number, number] = [15, 23, 42]
  const MUTED: [number, number, number] = [100, 116, 139]
  const LINE: [number, number, number] = [226, 232, 240]
  const SOFT: [number, number, number] = [248, 250, 252]

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 80) {
      drawFooter()
      doc.addPage()
      y = 56
    }
  }

  const drawFooter = () => {
    const fy = pageHeight - 32
    doc.setDrawColor(...LINE).line(left, fy - 14, right, fy - 14)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
    const footerLeft = `${orgNaam}${org?.email ? ' | ' + org.email : ''}`
    doc.text(footerLeft, left, fy)
    const pageNum = `Pagina ${doc.getCurrentPageInfo().pageNumber}`
    doc.text(pageNum, right, fy, { align: 'right' })
  }

  // ===== HEADER =====
  doc.setFillColor(...BRAND).rect(0, 0, pageWidth, 96, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(255, 255, 255)
  doc.text(orgNaam, left, 44)
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(219, 234, 254)
  doc.text('Huurcontract', left, 64)

  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(255, 255, 255)
  doc.text(contract.contract_nummer ?? '', right, 44, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(219, 234, 254)
  doc.text(`Opgemaakt op ${fmtDate(new Date().toISOString())}`, right, 60, { align: 'right' })
  if (contract.status) {
    doc.text(`Status: ${String(contract.status).toUpperCase()}`, right, 74, { align: 'right' })
  }

  y = 130

  const section = (title: string) => {
    ensureSpace(40)
    doc.setFillColor(...BRAND).rect(left, y, 3, 12, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
    doc.text(title.toUpperCase(), left + 10, y + 9)
    y += 18
    doc.setDrawColor(...LINE).line(left, y, right, y)
    y += 14
  }

  // Two-column info card
  const twoColCard = (rows: Array<[string, string | null | undefined]>) => {
    const filtered = rows.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '' && String(v) !== '-')
    const rowH = 22
    const colW = (contentW - 12) / 2
    const rowsCount = Math.ceil(filtered.length / 2)
    const cardH = rowsCount * rowH + 16
    ensureSpace(cardH + 8)
    doc.setFillColor(...SOFT).roundedRect(left, y, contentW, cardH, 6, 6, 'F')
    doc.setDrawColor(...LINE).roundedRect(left, y, contentW, cardH, 6, 6, 'S')
    let cy = y + 16
    filtered.forEach((pair, i) => {
      const isLeft = i % 2 === 0
      const cx = isLeft ? left + 14 : left + 14 + colW + 12
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
      doc.text(pair[0].toUpperCase(), cx, cy)
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
      doc.text(String(pair[1]), cx, cy + 11, { maxWidth: colW - 14 })
      if (!isLeft) cy += rowH
    })
    y += cardH + 14
  }

  // ===== CONTRACT =====
  section('Contractgegevens')
  twoColCard([
    ['Type', contract.type],
    ['Status', contract.status],
    ['Startdatum', fmtDate(contract.start_datum)],
    ['Einddatum', fmtDate(contract.eind_datum)],
    contract.maandprijs ? ['Maandprijs', money(contract.maandprijs)] : ['', ''],
    contract.dagprijs ? ['Dagprijs', money(contract.dagprijs)] : ['', ''],
    Number(contract.borg) > 0 ? ['Borg', money(contract.borg)] : ['', ''],
    contract.km_per_jaar ? ['Km per jaar', `${contract.km_per_jaar} km`] : ['', ''],
  ].filter(([k]) => k !== '') as Array<[string, string | null | undefined]>)

  // ===== KLANT =====
  section('Klantgegevens')
  twoColCard([
    ['Naam', contract.klant_naam],
    ['E-mail', contract.klant_email],
    ['Telefoon', contract.klant_telefoon],
    ['Adres', contract.klant_adres],
    ['Bedrijf', contract.bedrijf],
    ['KVK-nummer', contract.kvk_nummer],
  ])

  // ===== VOERTUIG =====
  if (vehicle) {
    section('Voertuig')
    twoColCard([
      ['Merk en model', `${vehicle.merk ?? ''} ${vehicle.model ?? ''}`.trim()],
      ['Kenteken', vehicle.kenteken],
      ['Bouwjaar', vehicle.bouwjaar ? String(vehicle.bouwjaar) : null],
      ['Brandstof', vehicle.brandstof],
      ['Categorie', vehicle.categorie],
      ['Kleur', vehicle.kleur],
    ])
  }

  // ===== SCHADE =====
  if (schades && schades.length > 0) {
    section(`Bekende schade (${schades.length})`)
    const ernstColor = (e: string): [number, number, number] => {
      const v = (e || '').toLowerCase()
      if (v.includes('zwaar') || v.includes('ernstig')) return [220, 38, 38]
      if (v.includes('middel') || v.includes('matig')) return [234, 88, 12]
      return [202, 138, 4]
    }
    schades.forEach((s) => {
      const omschrijving = s.omschrijving ?? '-'
      const lines = doc.splitTextToSize(String(omschrijving), contentW - 130)
      const cardH = Math.max(56, 28 + lines.length * 11)
      ensureSpace(cardH + 10)
      doc.setFillColor(255, 255, 255).roundedRect(left, y, contentW, cardH, 6, 6, 'F')
      doc.setDrawColor(...LINE).roundedRect(left, y, contentW, cardH, 6, 6, 'S')
      // Ernst badge
      const [er, eg, eb] = ernstColor(s.ernst)
      const badgeText = (s.ernst ?? 'licht').toString().toUpperCase()
      const badgeW = doc.getTextWidth(badgeText) + 14
      doc.setFillColor(er, eg, eb).roundedRect(left + 12, y + 12, badgeW, 14, 7, 7, 'F')
      doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(255, 255, 255)
      doc.text(badgeText, left + 12 + badgeW / 2, y + 22, { align: 'center' })
      // Datum
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
      doc.text(fmtDate(s.datum), right - 12, y + 22, { align: 'right' })
      // Locatie
      if (s.locatie_schade) {
        doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
        doc.text(String(s.locatie_schade), left + 12 + badgeW + 10, y + 22)
      }
      // Omschrijving
      doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK)
      doc.text(lines, left + 12, y + 40)
      // Hersteld indicator
      if (s.hersteld) {
        doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(22, 163, 74)
        doc.text('HERSTELD', right - 12, y + 40, { align: 'right' })
      }
      y += cardH + 8
    })
    y += 6
    doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(...MUTED)
    const note = 'De huurder verklaart bekend te zijn met bovenstaande schade en is hier niet verantwoordelijk voor.'
    doc.text(note, left, y)
    y += 14
  } else if (vehicle) {
    section('Schade')
    ensureSpace(40)
    doc.setFillColor(...SOFT).roundedRect(left, y, contentW, 32, 6, 6, 'F')
    doc.setDrawColor(...LINE).roundedRect(left, y, contentW, 32, 6, 6, 'S')
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK)
    doc.text('Geen bekende schade geregistreerd op het voertuig bij aanvang van het contract.', left + 12, y + 20)
    y += 44
  }

  // ===== INCLUSIEF =====
  if (Array.isArray(contract.inclusief) && contract.inclusief.length > 0) {
    section('Inbegrepen services')
    ensureSpace(20)
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK)
    contract.inclusief.forEach((item: string) => {
      ensureSpace(14)
      doc.setFillColor(...BRAND).circle(left + 4, y - 3, 1.8, 'F')
      doc.text(String(item), left + 14, y)
      y += 14
    })
    y += 6
  }

  // ===== BIJZONDERHEDEN =====
  if (contract.notities) {
    section('Bijzonderheden')
    const split = doc.splitTextToSize(contract.notities, contentW - 24)
    const h = split.length * 12 + 20
    ensureSpace(h)
    doc.setFillColor(...SOFT).roundedRect(left, y, contentW, h, 6, 6, 'F')
    doc.setDrawColor(...LINE).roundedRect(left, y, contentW, h, 6, 6, 'S')
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK)
    doc.text(split, left + 12, y + 14)
    y += h + 10
  }

  // ===== HANDTEKENINGEN =====
  ensureSpace(120)
  y += 10
  section('Ondertekening')
  const colW = (contentW - 24) / 2
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
  doc.text('Verhuurder', left, y)
  doc.text('Huurder', left + colW + 24, y)
  doc.setDrawColor(...INK)
  doc.line(left, y + 50, left + colW, y + 50)
  doc.line(left + colW + 24, y + 50, right, y + 50)
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
  doc.text(orgNaam, left, y + 64)
  doc.text(contract.klant_naam ?? '', left + colW + 24, y + 64)
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
  doc.text(`Plaats en datum: ${fmtDate(new Date().toISOString())}`, left, y + 78)
  doc.text(`Plaats en datum: ${fmtDate(new Date().toISOString())}`, left + colW + 24, y + 78)

  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawFooter()
  }

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
      const { data } = await admin.from('voertuigen').select('merk, model, kenteken, bouwjaar, brandstof, categorie, kleur').eq('id', contract.voertuig_id).maybeSingle()
      vehicle = data
    }

    let schades: any[] = []
    if (contract.voertuig_id) {
      const { data: sd } = await admin
        .from('schade_rapporten')
        .select('id, datum, omschrijving, locatie_schade, ernst, hersteld')
        .eq('voertuig_id', contract.voertuig_id)
        .eq('organisatie_id', contract.organisatie_id)
        .order('datum', { ascending: false })
      schades = sd ?? []
    }

    // Org info + AV pad
    const { data: org } = await admin
      .from('organisaties')
      .select('naam, algemene_voorwaarden_pad, email')
      .eq('id', contract.organisatie_id)
      .maybeSingle()

    const orgNaam = org?.naam ?? 'Verhuurder'

    const contractPdfBase64 = buildContractPdfBase64({ orgNaam, contract, vehicle, schades, org })
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