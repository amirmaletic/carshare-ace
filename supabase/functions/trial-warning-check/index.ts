import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Org = { id: string; naam: string; eigenaar_email: string | null; trial_ends_at: string }

const formatDatum = (iso: string) =>
  new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

const dagenTot = (iso: string) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(url, key)

  const result: Record<string, { kandidaten: number; verzonden: number; overgeslagen: number }> = {}

  const buckets: Array<{
    label: string
    rpc: 'admin_trial_warning_kandidaten' | 'admin_trial_urgent_kandidaten' | 'admin_trial_expired_kandidaten'
    markRpc: 'admin_mark_trial_warning_sent' | 'admin_mark_trial_urgent_sent' | 'admin_mark_trial_expired_sent'
    template: 'trial-bijna-verlopen' | 'trial-laatste-dagen' | 'trial-verlopen'
    idemPrefix: string
    buildData: (org: Org) => Record<string, any>
  }> = [
    {
      label: 'warning',
      rpc: 'admin_trial_warning_kandidaten',
      markRpc: 'admin_mark_trial_warning_sent',
      template: 'trial-bijna-verlopen',
      idemPrefix: 'trial-warning',
      buildData: (org) => ({
        organisatieNaam: org.naam,
        einddatum: formatDatum(org.trial_ends_at),
        dagenResterend: dagenTot(org.trial_ends_at),
      }),
    },
    {
      label: 'urgent',
      rpc: 'admin_trial_urgent_kandidaten',
      markRpc: 'admin_mark_trial_urgent_sent',
      template: 'trial-laatste-dagen',
      idemPrefix: 'trial-urgent',
      buildData: (org) => ({
        organisatieNaam: org.naam,
        einddatum: formatDatum(org.trial_ends_at),
        dagenResterend: dagenTot(org.trial_ends_at),
      }),
    },
    {
      label: 'expired',
      rpc: 'admin_trial_expired_kandidaten',
      markRpc: 'admin_mark_trial_expired_sent',
      template: 'trial-verlopen',
      idemPrefix: 'trial-expired',
      buildData: (org) => ({
        organisatieNaam: org.naam,
        einddatum: formatDatum(org.trial_ends_at),
      }),
    },
  ]

  for (const bucket of buckets) {
    const { data, error } = await supabase.rpc(bucket.rpc)
    if (error) {
      console.error(`Kandidaten ${bucket.label} ophalen mislukt`, error)
      result[bucket.label] = { kandidaten: 0, verzonden: 0, overgeslagen: 0 }
      continue
    }
    const orgs = (data ?? []) as Org[]
    let verzonden = 0
    let overgeslagen = 0
    for (const org of orgs) {
      if (!org.eigenaar_email) { overgeslagen++; continue }
      const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: bucket.template,
          recipientEmail: org.eigenaar_email,
          idempotencyKey: `${bucket.idemPrefix}-${org.id}-${org.trial_ends_at}`,
          templateData: bucket.buildData(org),
        },
      })
      if (sendErr) {
        console.error(`Mail (${bucket.label}) mislukt voor org`, org.id, sendErr)
        continue
      }
      await supabase.rpc(bucket.markRpc, { _org_id: org.id })
      verzonden++
    }
    result[bucket.label] = { kandidaten: orgs.length, verzonden, overgeslagen }
  }

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
