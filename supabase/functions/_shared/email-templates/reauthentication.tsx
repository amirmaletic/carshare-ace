/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Body, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je verificatiecode voor FleeFlo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="FleeFlo" width="120" height="40" style={logo} />
        <Heading style={h1}>Verificatiecode</Heading>
        <Text style={text}>Gebruik de onderstaande code om je identiteit te bevestigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>Deze code verloopt binnenkort. Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 46%)', lineHeight: '1.5', margin: '0 0 25px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 30px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
