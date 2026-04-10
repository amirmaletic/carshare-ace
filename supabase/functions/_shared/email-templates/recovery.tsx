/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Wachtwoord resetten voor FleeFlo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="FleeFlo" width="120" height="40" style={logo} />
        <Heading style={h1}>Wachtwoord resetten</Heading>
        <Text style={text}>Je hebt gevraagd om je wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord te kiezen.</Text>
        <Button style={button} href={confirmationUrl}>Wachtwoord resetten</Button>
        <Text style={footer}>Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren. Je wachtwoord wordt niet gewijzigd.</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 46%)', lineHeight: '1.5', margin: '0 0 25px' }
const button = { backgroundColor: 'hsl(221, 83%, 53%)', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
