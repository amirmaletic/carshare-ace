import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(url, key)

  const { data: kandidaten, error } = await supabase.rpc('admin_trial_warning_kandidaten')
  if (error) {
    console.error('Kandidaten ophalen mislukt', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let verzonden = 0
  let overgeslagen = 0
  for (const org of (kandidaten ?? []) as Array<{ id: string; naam: string; eigenaar_email: string | null; trial_ends_at: string }>) {
    if (!org.eigenaar_email) { overgeslagen++; continue }
    const end = new Date(org.trial_ends_at)
    const dagenResterend = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const einddatum = end.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

    const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'trial-bijna-verlopen',
        recipientEmail: org.eigenaar_email,
        idempotencyKey: `trial-warning-${org.id}-${org.trial_ends_at}`,
        templateData: { organisatieNaam: org.naam, einddatum, dagenResterend },
      },
    })
    if (sendErr) {
      console.error('Mail mislukt voor org', org.id, sendErr)
      continue
    }
    await supabase.rpc('admin_mark_trial_warning_sent', { _org_id: org.id })
    verzonden++
  }

  return new Response(JSON.stringify({ kandidaten: (kandidaten ?? []).length, verzonden, overgeslagen }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
