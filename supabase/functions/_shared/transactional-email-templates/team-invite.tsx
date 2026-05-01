/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface TeamInviteProps {
  organisatieNaam?: string
  rolLabel?: string
  acceptUrl?: string
  uitgenodigdDoor?: string
}

const TeamInviteEmail = ({ organisatieNaam, rolLabel, acceptUrl, uitgenodigdDoor }: TeamInviteProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je bent uitgenodigd voor {organisatieNaam ?? SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="120" height="40" style={logo} />
        <Heading style={h1}>Je bent uitgenodigd!</Heading>
        <Text style={text}>
          {uitgenodigdDoor ? `${uitgenodigdDoor} heeft je` : 'Je bent'} uitgenodigd om deel te nemen aan
          {' '}<strong>{organisatieNaam ?? 'een organisatie'}</strong> op {SITE_NAME}
          {rolLabel ? <> als <strong>{rolLabel}</strong></> : null}.
        </Text>
        <Text style={text}>
          Klik op de knop hieronder om je account aan te maken en de uitnodiging te accepteren.
        </Text>
        {acceptUrl ? (
          <Button style={button} href={acceptUrl}>Uitnodiging accepteren</Button>
        ) : null}
        <Text style={footer}>
          Verwachtte je deze uitnodiging niet? Dan kun je deze e-mail veilig negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeamInviteEmail,
  subject: (data: Record<string, any>) =>
    `Je bent uitgenodigd voor ${data?.organisatieNaam ?? SITE_NAME}`,
  displayName: 'Team uitnodiging',
  previewData: {
    organisatieNaam: 'Acme Verhuur',
    rolLabel: 'Beheerder',
    acceptUrl: 'https://fleeflo.nl/auth?invite=sample-token',
    uitgenodigdDoor: 'jan@acme.nl',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 46%)', lineHeight: '1.5', margin: '0 0 18px' }
const button = { backgroundColor: '#3B82F6', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block', margin: '8px 0 24px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }