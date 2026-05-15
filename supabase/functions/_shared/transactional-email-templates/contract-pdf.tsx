/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'

interface Props {
  klant_naam?: string
  contract_nummer?: string
  org_naam?: string
  contract_url?: string
  av_url?: string | null
}

const ContractPdfEmail = ({ klant_naam, contract_nummer, org_naam, contract_url, av_url }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Uw huurcontract {contract_nummer ?? ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={org_naam ?? 'FleeFlo'} width="120" height="40" style={logo} />
        <Heading style={h1}>Uw huurcontract is rond</Heading>
        <Text style={text}>Beste {klant_naam ?? 'klant'},</Text>
        <Text style={text}>
          Bij deze ontvangt u uw huurcontract <strong>{contract_nummer}</strong>
          {av_url ? ' en de bijbehorende algemene voorwaarden' : ''}. U kunt de documenten hieronder downloaden.
        </Text>
        {contract_url ? (
          <Section style={btnWrap}>
            <Button href={contract_url} style={btn}>Download huurcontract (PDF)</Button>
          </Section>
        ) : null}
        {av_url ? (
          <Section style={btnWrap}>
            <Button href={av_url} style={btnSecondary}>Download algemene voorwaarden (PDF)</Button>
          </Section>
        ) : null}
        <Text style={hint}>De downloadlinks zijn 30 dagen geldig. Bewaar de documenten zorgvuldig.</Text>
        <Hr style={hr} />
        <Text style={footer}>Met vriendelijke groet,<br/>{org_naam ?? 'FleeFlo'}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContractPdfEmail,
  subject: (data: Record<string, any>) => `Uw huurcontract ${data?.contract_nummer ?? ''}`.trim(),
  displayName: 'Huurcontract toesturen',
  previewData: {
    klant_naam: 'Jan de Vries',
    contract_nummer: 'VC-2026-003',
    org_naam: 'FleeFlo',
    contract_url: 'https://example.com/contract.pdf',
    av_url: 'https://example.com/av.pdf',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 30%)', lineHeight: '1.6', margin: '0 0 16px' }
const btnWrap = { margin: '12px 0' }
const btn = { background: '#3B82F6', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 as const, textDecoration: 'none', display: 'inline-block' }
const btnSecondary = { background: '#ffffff', color: '#3B82F6', padding: '11px 19px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 as const, textDecoration: 'none', display: 'inline-block', border: '1px solid #3B82F6' }
const hint = { fontSize: '12px', color: '#64748B', margin: '16px 0 0' }
const hr = { borderColor: '#E2E8F0', margin: '24px 0 12px' }
const footer = { fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }
