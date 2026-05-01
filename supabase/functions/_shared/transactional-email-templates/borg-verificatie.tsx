/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface Props { klant_naam?: string; contract_nummer?: string; checkout_url?: string; bedrag?: string }

const BorgVerificatieEmail = ({ klant_naam, contract_nummer, checkout_url, bedrag }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Verifieer je rekening met een iDEAL betaling van € {bedrag ?? '0,01'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="120" height="40" style={logo} />
        <Heading style={h1}>Borg-verificatie via iDEAL</Heading>
        <Text style={text}>Hallo {klant_naam ?? 'daar'},</Text>
        <Text style={text}>
          Voor contract <strong>{contract_nummer}</strong> verifiëren we je bankrekening via een eenmalige iDEAL betaling van <strong>€ {bedrag ?? '0,01'}</strong>.
          Dit bedrag wordt verrekend met je eerstvolgende factuur.
        </Text>
        <Section style={infoBox}>
          <Text style={infoItem}>· Eenmalige betaling van € {bedrag ?? '0,01'}</Text>
          <Text style={infoItem}>· Bevestigt je identiteit en rekeningnummer</Text>
          <Text style={infoItem}>· Wordt verrekend met je factuur</Text>
        </Section>
        {checkout_url ? <Button style={button} href={checkout_url}>Betaal nu met iDEAL</Button> : null}
        <Text style={footer}>Vragen? Antwoord gerust op deze e-mail.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BorgVerificatieEmail,
  subject: (data: Record<string, any>) => `Borg-verificatie contract ${data?.contract_nummer ?? ''}`.trim(),
  displayName: 'Borg-verificatie iDEAL',
  previewData: { klant_naam: 'Jan de Vries', contract_nummer: 'C-2026-001', checkout_url: 'https://checkout.stripe.com/x', bedrag: '0,01' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 30%)', lineHeight: '1.6', margin: '0 0 16px' }
const infoBox = { background: 'hsl(215, 100%, 97%)', border: '1px solid hsl(215, 90%, 90%)', borderRadius: '10px', padding: '16px 18px', margin: '20px 0' }
const infoItem = { fontSize: '13px', color: 'hsl(215, 14%, 30%)', margin: '0 0 4px', lineHeight: '1.5' }
const button = { backgroundColor: '#3B82F6', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 22px', textDecoration: 'none', display: 'inline-block', margin: '12px 0 8px', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', lineHeight: '1.5' }