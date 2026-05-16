/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface TrialVerlengdProps {
  organisatieNaam?: string
  nieuweEinddatum?: string
  dagenToegevoegd?: number
}

const TrialVerlengdEmail = ({ organisatieNaam, nieuweEinddatum, dagenToegevoegd }: TrialVerlengdProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je proefperiode bij {SITE_NAME} is verlengd</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="120" height="40" style={logo} />
        <Heading style={h1}>Je proefperiode is verlengd</Heading>
        <Text style={text}>
          Goed nieuws! De proefperiode van <strong>{organisatieNaam ?? 'je organisatie'}</strong>{' '}
          op {SITE_NAME} is{dagenToegevoegd ? <> verlengd met <strong>{dagenToegevoegd} dagen</strong></> : ' verlengd'}.
        </Text>
        {nieuweEinddatum ? (
          <Text style={text}>
            Nieuwe einddatum: <strong>{nieuweEinddatum}</strong>
          </Text>
        ) : null}
        <Text style={text}>
          Je kunt zonder onderbreking blijven werken in je omgeving. Heb je vragen of wil je het
          abonnement activeren? Reageer dan op deze e-mail.
        </Text>
        <Text style={footer}>
          Team {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TrialVerlengdEmail,
  subject: (data: Record<string, any>) =>
    `Je proefperiode bij ${SITE_NAME} is verlengd${data?.dagenToegevoegd ? ` met ${data.dagenToegevoegd} dagen` : ''}`,
  displayName: 'Proefperiode verlengd',
  previewData: {
    organisatieNaam: 'Acme Verhuur',
    nieuweEinddatum: '15 juni 2026',
    dagenToegevoegd: 30,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 46%)', lineHeight: '1.5', margin: '0 0 18px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
