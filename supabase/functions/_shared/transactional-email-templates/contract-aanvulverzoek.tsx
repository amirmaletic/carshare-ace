/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface Props {
  klantNaam?: string
  organisatieNaam?: string
  contractNummer?: string
  ontbrekend?: string[]
  url?: string
  vervaltOp?: string
}

const ContractAanvulverzoekEmail = ({ klantNaam, organisatieNaam, contractNummer, ontbrekend, url, vervaltOp }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>
      Vul je gegevens aan voor contract {contractNummer ?? ''} bij {organisatieNaam ?? SITE_NAME}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="120" height="40" style={logo} />
        <Heading style={h1}>Vul je huurgegevens aan</Heading>
        <Text style={text}>Hallo {klantNaam ?? 'daar'},</Text>
        <Text style={text}>
          Voor je huurovereenkomst <strong>{contractNummer ?? ''}</strong> bij{' '}
          <strong>{organisatieNaam ?? SITE_NAME}</strong> hebben we nog enkele gegevens nodig.
          Je kunt ze in een paar minuten zelf invullen via onderstaande knop.
        </Text>
        {ontbrekend && ontbrekend.length > 0 ? (
          <Section style={infoBox}>
            <Text style={infoTitle}>Wat hebben we nog nodig?</Text>
            {ontbrekend.map((item) => (
              <Text key={item} style={infoItem}>· {item}</Text>
            ))}
          </Section>
        ) : null}
        {url ? (
          <Button style={button} href={url}>Gegevens aanvullen</Button>
        ) : null}
        {vervaltOp ? (
          <Text style={smallText}>Deze link verloopt op <strong>{vervaltOp}</strong>.</Text>
        ) : null}
        <Text style={footer}>
          Heb je vragen? Neem gerust contact op met {organisatieNaam ?? SITE_NAME}. Als je deze
          e-mail onverwacht ontvangt, kun je hem veilig negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContractAanvulverzoekEmail,
  subject: (data: Record<string, any>) =>
    `Vul je gegevens aan voor contract ${data?.contractNummer ?? ''} bij ${data?.organisatieNaam ?? SITE_NAME}`,
  displayName: 'Contract aanvulverzoek',
  previewData: {
    klantNaam: 'Jan de Vries',
    organisatieNaam: 'Acme Verhuur',
    contractNummer: 'VC-2026-001',
    ontbrekend: ['Adres', 'Telefoonnummer', 'Rijbewijsnummer en geldigheid'],
    url: 'https://fleeflo.nl/contract-aanvullen/sample-token',
    vervaltOp: '29 mei 2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 30%)', lineHeight: '1.6', margin: '0 0 16px' }
const smallText = { fontSize: '12px', color: 'hsl(215, 14%, 50%)', margin: '8px 0 0' }
const infoBox = { background: 'hsl(215, 100%, 97%)', border: '1px solid hsl(215, 90%, 90%)', borderRadius: '10px', padding: '16px 18px', margin: '20px 0' }
const infoTitle = { fontSize: '13px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 8px' }
const infoItem = { fontSize: '13px', color: 'hsl(215, 14%, 30%)', margin: '0 0 4px', lineHeight: '1.5' }
const button = { backgroundColor: 'hsl(217, 91%, 60%)', color: '#ffffff', padding: '12px 22px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' as const, display: 'inline-block', margin: '8px 0 16px' }
const footer = { fontSize: '12px', color: 'hsl(215, 14%, 50%)', margin: '24px 0 0', lineHeight: '1.5' }