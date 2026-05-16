/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://wqqebuxglxphivghekyz.supabase.co/storage/v1/object/public/email-assets/fleeflo-logo.png'
const SITE_NAME = 'FleeFlo'

interface Props {
  klant_naam?: string
  contract_nummer?: string
  bedrag?: string
  periode?: string
  vervaldatum?: string
  omschrijving?: string
}

const FactuurAangemaaktEmail = ({ klant_naam, contract_nummer, bedrag, periode, vervaldatum, omschrijving }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Nieuwe factuur {contract_nummer ?? ''} | € {bedrag ?? ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="52" height="48" style={logo} />
        <Heading style={h1}>Nieuwe factuur klaar</Heading>
        <Text style={text}>Hallo {klant_naam ?? 'daar'},</Text>
        <Text style={text}>
          Hierbij de nieuwe maandfactuur voor je contract <strong>{contract_nummer}</strong>
          {periode ? <> voor periode <strong>{periode}</strong></> : null}.
        </Text>
        <Section style={infoBox}>
          <Text style={infoItem}><strong>Bedrag:</strong> € {bedrag}</Text>
          {vervaldatum ? <Text style={infoItem}><strong>Vervaldatum:</strong> {vervaldatum}</Text> : null}
          {omschrijving ? <Text style={infoItem}><strong>Omschrijving:</strong> {omschrijving}</Text> : null}
        </Section>
        <Text style={text}>Je ontvangt deze factuur ook in je klantportaal.</Text>
        <Text style={footer}>Met vriendelijke groet, het {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FactuurAangemaaktEmail,
  subject: (d: Record<string, any>) => `Nieuwe factuur ${d.contract_nummer ?? ''} | € ${d.bedrag ?? ''}`,
  displayName: 'Factuur aangemaakt',
  previewData: {
    klant_naam: 'Jan Jansen',
    contract_nummer: 'C-2026-0042',
    bedrag: '499,00',
    periode: 'mei 2026',
    vervaldatum: '31-05-2026',
    omschrijving: 'Maandtermijn lease Audi A3',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 16px' }
const infoBox = { backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '16px 20px', margin: '12px 0 20px' }
const infoItem = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '28px 0 0' }