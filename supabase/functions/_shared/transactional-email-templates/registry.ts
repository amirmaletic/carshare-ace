/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as teamInvite } from './team-invite.tsx'
import { template as rijbewijsVerzoek } from './rijbewijs-verzoek.tsx'
import { template as borgVerificatie } from './borg-verificatie.tsx'
import { template as contractOndertekend } from './contract-ondertekend.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'team-invite': teamInvite,
  'rijbewijs-verzoek': rijbewijsVerzoek,
  'borg-verificatie': borgVerificatie,
  'contract-ondertekend': contractOndertekend,
}