/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je inloglink voor FleeFlo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="FleeFlo" width="120" height="40" style={logo} />
        <Heading style={h1}>Je inloglink</Heading>
        <Text style={text}>Klik op de knop hieronder om in te loggen bij FleeFlo. Deze link verloopt binnenkort.</Text>
        <Button style={button} href={confirmationUrl}>Inloggen</Button>
        <Text style={footer}>Als je deze link niet hebt aangevraagd, kun je deze e-mail veilig negeren.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 46%)', lineHeight: '1.5', margin: '0 0 25px' }
const button = { backgroundColor: 'hsl(221, 83%, 53%)', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
