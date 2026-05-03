/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface Props {
  klant_naam?: string
  voertuig_naam?: string
  voertuig_kenteken?: string
  type?: string
  datum?: string
  kilometerstand?: string | null
  opmerkingen?: string | null
  bevestiging?: string
  handtekening?: string
}

const ContractOndertekendEmail = ({
  klant_naam, voertuig_naam, voertuig_kenteken, type, datum, kilometerstand, opmerkingen, bevestiging, handtekening,
}: Props) => {
  const titel = type === 'terugbrengen' ? 'Bevestiging terugbrengen voertuig' : 'Bevestiging ophalen voertuig'
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{titel} | {voertuig_kenteken}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="120" height="40" style={logo} />
          <Heading style={h1}>{titel}</Heading>
          <Text style={text}>Hallo {klant_naam ?? 'daar'},</Text>
          <Text style={text}>
            Hierbij je kopie van de ondertekende overdracht. Bewaar deze e-mail als bewijs.
          </Text>
          <Section style={infoBox}>
            <Text style={infoItem}><strong>Voertuig:</strong> {voertuig_naam}</Text>
            <Text style={infoItem}><strong>Kenteken:</strong> {voertuig_kenteken}</Text>
            <Text style={infoItem}><strong>Datum:</strong> {datum}</Text>
            {kilometerstand ? <Text style={infoItem}><strong>Kilometerstand:</strong> {kilometerstand} km</Text> : null}
            {opmerkingen ? <Text style={infoItem}><strong>Opmerkingen:</strong> {opmerkingen}</Text> : null}
          </Section>
          {bevestiging ? (
            <Section style={quoteBox}>
              <Text style={quote}>&ldquo;{bevestiging}&rdquo;</Text>
            </Section>
          ) : null}
          {handtekening ? (
            <Section style={sigBox}>
              <Text style={sigLabel}>Jouw handtekening</Text>
              <Img src={handtekening} alt="Handtekening" width="280" style={sigImg} />
            </Section>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>Vragen? Antwoord gerust op deze e-mail. {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ContractOndertekendEmail,
  subject: (data: Record<string, any>) =>
    data?.type === 'terugbrengen'
      ? `Bevestiging terugbrengen ${data?.voertuig_kenteken ?? ''}`.trim()
      : `Bevestiging ophalen ${data?.voertuig_kenteken ?? ''}`.trim(),
  displayName: 'Contract overdracht ondertekend',
  previewData: {
    klant_naam: 'Jan de Vries',
    voertuig_naam: 'Volkswagen Golf',
    voertuig_kenteken: 'AB-123-C',
    type: 'ophalen',
    datum: '3 mei 2026',
    kilometerstand: '45230',
    opmerkingen: 'Voertuig in nette staat ontvangen.',
    bevestiging: 'Ik bevestig dat ik het voertuig in ontvangst heb genomen.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 30%)', lineHeight: '1.6', margin: '0 0 16px' }
const infoBox = { background: 'hsl(215, 100%, 97%)', border: '1px solid hsl(215, 90%, 90%)', borderRadius: '10px', padding: '16px 18px', margin: '20px 0' }
const infoItem = { fontSize: '13px', color: 'hsl(215, 14%, 30%)', margin: '0 0 6px', lineHeight: '1.5' }
const quoteBox = { background: '#F8FAFC', borderLeft: '3px solid #3B82F6', padding: '12px 16px', margin: '16px 0', borderRadius: '4px' }
const quote = { fontSize: '13px', color: '#334155', fontStyle: 'italic' as const, margin: 0, lineHeight: '1.6' }
const sigBox = { margin: '20px 0', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#fff' }
const sigLabel = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.6px', color: '#64748B', margin: '0 0 8px', fontWeight: 600 as const }
const sigImg = { display: 'block', maxWidth: '100%', height: 'auto' }
const hr = { borderColor: '#E2E8F0', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#999999', margin: 0, lineHeight: '1.5' }
