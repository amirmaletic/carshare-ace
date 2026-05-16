/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface Props {
  organisatieNaam?: string
  einddatum?: string
  dagenResterend?: number
}

const Email = ({ organisatieNaam, einddatum, dagenResterend }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je proefperiode bij {SITE_NAME} loopt binnenkort af</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="52" height="48" style={logo} />
        <Heading style={h1}>Je proefperiode loopt binnenkort af</Heading>
        <Text style={text}>
          De proefperiode van <strong>{organisatieNaam ?? 'je organisatie'}</strong>{' '}
          op {SITE_NAME} eindigt op <strong>{einddatum ?? 'binnenkort'}</strong>
          {typeof dagenResterend === 'number' ? <> ({dagenResterend} dagen resterend)</> : null}.
        </Text>
        <Text style={text}>
          Wil je zonder onderbreking blijven werken? Reageer dan op deze e-mail
          om je abonnement te activeren of een verlenging te bespreken.
        </Text>
        <Text style={footer}>Team {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Je ${SITE_NAME} proefperiode loopt af${d?.dagenResterend ? ` over ${d.dagenResterend} dagen` : ''}`,
  displayName: 'Trial loopt binnenkort af',
  previewData: { organisatieNaam: 'Acme Verhuur', einddatum: '22 mei 2026', dagenResterend: 6 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 46%)', lineHeight: '1.5', margin: '0 0 18px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
