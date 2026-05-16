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
}

const Email = ({ organisatieNaam, einddatum }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je {SITE_NAME} proefperiode is verlopen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="52" height="48" style={logo} />
        <Heading style={h1}>Je proefperiode is verlopen</Heading>
        <Text style={text}>
          De proefperiode van <strong>{organisatieNaam ?? 'je organisatie'}</strong>{' '}
          op {SITE_NAME} is afgelopen op <strong>{einddatum ?? 'recent'}</strong>.
          Je gegevens blijven veilig bewaard.
        </Text>
        <Text style={text}>
          Wil je weer aan de slag? Reageer dan op deze e-mail om je abonnement
          te activeren of een verlenging af te spreken. We zetten je account
          binnen één werkdag weer open.
        </Text>
        <Text style={footer}>Team {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: `Je ${SITE_NAME} proefperiode is verlopen`,
  displayName: 'Trial verlopen',
  previewData: { organisatieNaam: 'Acme Verhuur', einddatum: '15 mei 2026' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 46%)', lineHeight: '1.5', margin: '0 0 18px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }