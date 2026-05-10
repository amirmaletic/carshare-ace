/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface Props {
  klant_naam?: string
  contract_nummer?: string
  voertuig?: string
  eind_datum?: string
  dagen_resterend?: string | number
  verlengbaar?: boolean
}

const ContractVerlooptEmail = ({ klant_naam, contract_nummer, voertuig, eind_datum, dagen_resterend, verlengbaar }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Contract {contract_nummer ?? ''} verloopt over {dagen_resterend ?? ''} dagen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="120" height="40" style={logo} />
        <Heading style={h1}>Je contract verloopt binnenkort</Heading>
        <Text style={text}>Hallo {klant_naam ?? 'daar'},</Text>
        <Text style={text}>
          Je contract <strong>{contract_nummer}</strong>{voertuig ? <> voor <strong>{voertuig}</strong></> : null} verloopt
          over <strong>{dagen_resterend} dagen</strong> op <strong>{eind_datum}</strong>.
        </Text>
        <Section style={infoBox}>
          <Text style={infoItem}>
            {verlengbaar
              ? 'Wil je het contract verlengen? Neem contact met ons op om de mogelijkheden te bespreken.'
              : 'Neem op tijd contact met ons op om een vervolgcontract te regelen of het voertuig in te leveren.'}
          </Text>
        </Section>
        <Text style={footer}>Met vriendelijke groet, het {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContractVerlooptEmail,
  subject: (d: Record<string, any>) => `Je contract ${d.contract_nummer ?? ''} verloopt over ${d.dagen_resterend ?? ''} dagen`,
  displayName: 'Contract verloopt',
  previewData: {
    klant_naam: 'Jan Jansen',
    contract_nummer: 'C-2026-0042',
    voertuig: 'Audi A3 (12-AB-34)',
    eind_datum: '08-07-2026',
    dagen_resterend: 60,
    verlengbaar: true,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 16px' }
const infoBox = { backgroundColor: '#eff6ff', borderRadius: '8px', padding: '16px 20px', margin: '12px 0 20px', borderLeft: '3px solid #3B82F6' }
const infoItem = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '28px 0 0' }