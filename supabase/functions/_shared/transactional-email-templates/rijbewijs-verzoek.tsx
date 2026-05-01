/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface RijbewijsVerzoekProps {
  klantNaam?: string
  organisatieNaam?: string
  uploadUrl?: string
  vervaltOp?: string
  isHerinnering?: boolean
}

const RijbewijsVerzoekEmail = ({ klantNaam, organisatieNaam, uploadUrl, vervaltOp, isHerinnering }: RijbewijsVerzoekProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>
      {isHerinnering
        ? `Herinnering: upload je rijbewijs voor ${organisatieNaam ?? SITE_NAME}`
        : `Upload je rijbewijs voor ${organisatieNaam ?? SITE_NAME}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="120" height="40" style={logo} />
        <Heading style={h1}>
          {isHerinnering ? 'Herinnering · Rijbewijs uploaden' : 'Upload je rijbewijs'}
        </Heading>
        <Text style={text}>
          Hallo {klantNaam ?? 'daar'},
        </Text>
        <Text style={text}>
          Voor je huurovereenkomst bij <strong>{organisatieNaam ?? SITE_NAME}</strong> hebben wij
          een geldig rijbewijs nodig. Dit is een verplichte stap voor we het voertuig kunnen
          overdragen.
        </Text>
        <Section style={infoBox}>
          <Text style={infoTitle}>Wat hebben we nodig?</Text>
          <Text style={infoItem}>· Duidelijke foto van de <strong>voorkant</strong> van je rijbewijs</Text>
          <Text style={infoItem}>· Duidelijke foto van de <strong>achterkant</strong> van je rijbewijs</Text>
          <Text style={infoItem}>· Goed leesbaar, alle hoeken zichtbaar, geen reflectie</Text>
        </Section>
        <Text style={text}>
          Het uploaden duurt minder dan een minuut. Je gegevens worden direct geverifieerd via
          een beveiligde verbinding.
        </Text>
        {uploadUrl ? (
          <Button style={button} href={uploadUrl}>Rijbewijs uploaden</Button>
        ) : null}
        {vervaltOp ? (
          <Text style={smallText}>Deze link verloopt op <strong>{vervaltOp}</strong>.</Text>
        ) : null}
        <Text style={footer}>
          Vragen? Neem gerust contact op met {organisatieNaam ?? SITE_NAME}. Heb je deze e-mail
          onverwacht ontvangen, dan kun je deze veilig negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RijbewijsVerzoekEmail,
  subject: (data: Record<string, any>) =>
    data?.isHerinnering
      ? `Herinnering · Upload je rijbewijs voor ${data?.organisatieNaam ?? SITE_NAME}`
      : `Upload je rijbewijs voor ${data?.organisatieNaam ?? SITE_NAME}`,
  displayName: 'Rijbewijs upload-verzoek',
  previewData: {
    klantNaam: 'Jan de Vries',
    organisatieNaam: 'Acme Verhuur',
    uploadUrl: 'https://fleeflo.nl/rijbewijs/sample-token',
    vervaltOp: '15 mei 2026',
    isHerinnering: false,
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
const button = { backgroundColor: '#3B82F6', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 22px', textDecoration: 'none', display: 'inline-block', margin: '12px 0 8px', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', lineHeight: '1.5' }