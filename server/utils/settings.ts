import { ensureDb, dbApi } from './db'

export type SettingsStore = {
  seatsio: {
    workspacePublicKey: string
    secretKey: string
    region: 'eu' | 'na' | 'sa' | 'oc'
  }
  stripe: {
    publishableKey: string
    secretKey: string
    webhookSecret: string
    connect: {
      platformAccountId: string
      connectedAccountId: string
      enabled: boolean
    }
  }
  otpVpos: {
    merchantId: string
    apiKey: string
    endpoint: string
    enabled: boolean
  }
  email: {
    provider: 'smtp' | 'resend' | 'log'
    from: string
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    smtpSecure: boolean
    resendApiKey: string
  }
  company: {
    name: string
    street: string
    zip: string
    city: string
    country: string
    email: string
    phone: string
    managingDirector: string
    hrb: string
    court: string
    steuernummer: string
    ustId: string
    privacyEmail: string
  }
  commerce: {
    currency: string
    holdMinutes: number
    commissionPercent: number
    siteUrl: string
  }
  updatedAt: string | null
}

const DEFAULTS: SettingsStore = {
  seatsio: { workspacePublicKey: '', secretKey: '', region: 'eu' },
  stripe: {
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    connect: { platformAccountId: '', connectedAccountId: '', enabled: false }
  },
  otpVpos: { merchantId: '', apiKey: '', endpoint: '', enabled: false },
  email: {
    provider: 'log',
    from: 'tickets@ticketshop.local',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: true,
    resendApiKey: ''
  },
  company: {
    name: '[FIRMA]',
    street: '[STRASSE]',
    zip: '[PLZ]',
    city: '[ORT]',
    country: 'Deutschland',
    email: '[EMAIL]',
    phone: '[TELEFON]',
    managingDirector: '[GESCHAEFTSFUEHRUNG]',
    hrb: '[HRB]',
    court: '[AMTSGERICHT]',
    steuernummer: '[STEUERNUMMER]',
    ustId: '[UST-ID]',
    privacyEmail: '[PRIVACY-EMAIL]'
  },
  commerce: {
    currency: 'eur',
    holdMinutes: 20,
    commissionPercent: 3,
    siteUrl: 'http://localhost:3000'
  },
  updatedAt: null
}

export function maskSecret(value: string | undefined | null): string {
  if (!value) return ''
  if (value.length <= 4) return '••••'
  return `••••••••${value.slice(-4)}`
}

export function isMaskedPlaceholder(value: string | undefined | null): boolean {
  if (value == null) return true
  const v = value.trim()
  if (!v) return true
  return v.startsWith('••••')
}

function mergeDefaults(parsed: Partial<SettingsStore> | null): SettingsStore {
  const p = parsed || {}
  return {
    seatsio: {
      workspacePublicKey: p.seatsio?.workspacePublicKey || '',
      secretKey: p.seatsio?.secretKey || '',
      region: (p.seatsio?.region as SettingsStore['seatsio']['region']) || 'eu'
    },
    stripe: {
      publishableKey: p.stripe?.publishableKey || '',
      secretKey: p.stripe?.secretKey || '',
      webhookSecret: p.stripe?.webhookSecret || '',
      connect: {
        platformAccountId: p.stripe?.connect?.platformAccountId || '',
        connectedAccountId: p.stripe?.connect?.connectedAccountId || '',
        enabled: !!p.stripe?.connect?.enabled
      }
    },
    otpVpos: {
      merchantId: p.otpVpos?.merchantId || '',
      apiKey: p.otpVpos?.apiKey || '',
      endpoint: p.otpVpos?.endpoint || '',
      enabled: !!p.otpVpos?.enabled
    },
    email: {
      provider: (p.email?.provider as SettingsStore['email']['provider']) || 'log',
      from: p.email?.from || DEFAULTS.email.from,
      smtpHost: p.email?.smtpHost || '',
      smtpPort: p.email?.smtpPort ?? 587,
      smtpUser: p.email?.smtpUser || '',
      smtpPass: p.email?.smtpPass || '',
      smtpSecure: p.email?.smtpSecure ?? true,
      resendApiKey: p.email?.resendApiKey || ''
    },
    company: { ...DEFAULTS.company, ...(p.company || {}) },
    commerce: {
      currency: p.commerce?.currency || 'eur',
      holdMinutes: p.commerce?.holdMinutes ?? 20,
      commissionPercent: p.commerce?.commissionPercent ?? 3,
      siteUrl: p.commerce?.siteUrl || 'http://localhost:3000'
    },
    updatedAt: p.updatedAt || null
  }
}

export async function readSettings(): Promise<SettingsStore> {
  await ensureDb()
  const row = dbApi.get<{ data: string }>('SELECT data FROM settings WHERE id = 1')
  if (!row) return structuredClone(DEFAULTS)
  try {
    return mergeDefaults(JSON.parse(row.data))
  } catch {
    return structuredClone(DEFAULTS)
  }
}

export async function writeSettings(next: SettingsStore): Promise<void> {
  await ensureDb()
  dbApi.run('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)', [JSON.stringify(next)])
  dbApi.persistNow()
}

function applySecretField(incoming: string | undefined, existing: string): string {
  if (incoming === undefined) return existing
  if (isMaskedPlaceholder(incoming)) return existing
  return incoming.trim()
}

function applyPublicField(incoming: string | undefined, existing: string): string {
  if (incoming === undefined) return existing
  if (isMaskedPlaceholder(incoming) && existing) return existing
  return incoming.trim()
}

export function applySettingsUpdate(current: SettingsStore, body: Record<string, any>): SettingsStore {
  const next = structuredClone(current)

  if (body.seatsio) {
    if (body.seatsio.region && ['eu', 'na', 'sa', 'oc'].includes(body.seatsio.region)) {
      next.seatsio.region = body.seatsio.region
    }
    next.seatsio.workspacePublicKey = applyPublicField(
      body.seatsio.workspacePublicKey,
      current.seatsio.workspacePublicKey
    )
    next.seatsio.secretKey = applySecretField(body.seatsio.secretKey, current.seatsio.secretKey)
  }

  if (body.stripe) {
    next.stripe.publishableKey = applyPublicField(
      body.stripe.publishableKey,
      current.stripe.publishableKey
    )
    next.stripe.secretKey = applySecretField(body.stripe.secretKey, current.stripe.secretKey)
    next.stripe.webhookSecret = applySecretField(
      body.stripe.webhookSecret,
      current.stripe.webhookSecret
    )
    if (body.stripe.connect) {
      if (typeof body.stripe.connect.enabled === 'boolean') {
        next.stripe.connect.enabled = body.stripe.connect.enabled
      }
      if (typeof body.stripe.connect.platformAccountId === 'string') {
        next.stripe.connect.platformAccountId = body.stripe.connect.platformAccountId.trim()
      }
      if (typeof body.stripe.connect.connectedAccountId === 'string') {
        next.stripe.connect.connectedAccountId = body.stripe.connect.connectedAccountId.trim()
      }
    }
  }

  if (body.otpVpos) {
    if (typeof body.otpVpos.enabled === 'boolean') next.otpVpos.enabled = body.otpVpos.enabled
    if (typeof body.otpVpos.merchantId === 'string') {
      next.otpVpos.merchantId = body.otpVpos.merchantId.trim()
    }
    if (typeof body.otpVpos.endpoint === 'string') {
      next.otpVpos.endpoint = body.otpVpos.endpoint.trim()
    }
    next.otpVpos.apiKey = applySecretField(body.otpVpos.apiKey, current.otpVpos.apiKey)
  }

  if (body.email) {
    if (body.email.provider && ['smtp', 'resend', 'log'].includes(body.email.provider)) {
      next.email.provider = body.email.provider
    }
    if (typeof body.email.from === 'string') next.email.from = body.email.from.trim()
    if (typeof body.email.smtpHost === 'string') next.email.smtpHost = body.email.smtpHost.trim()
    if (typeof body.email.smtpPort === 'number') next.email.smtpPort = body.email.smtpPort
    if (typeof body.email.smtpUser === 'string') next.email.smtpUser = body.email.smtpUser.trim()
    if (typeof body.email.smtpSecure === 'boolean') next.email.smtpSecure = body.email.smtpSecure
    next.email.smtpPass = applySecretField(body.email.smtpPass, current.email.smtpPass)
    next.email.resendApiKey = applySecretField(body.email.resendApiKey, current.email.resendApiKey)
  }

  if (body.company && typeof body.company === 'object') {
    for (const key of Object.keys(DEFAULTS.company) as (keyof SettingsStore['company'])[]) {
      if (typeof body.company[key] === 'string') {
        next.company[key] = body.company[key].trim()
      }
    }
  }

  if (body.commerce) {
    if (typeof body.commerce.currency === 'string') next.commerce.currency = body.commerce.currency
    if (typeof body.commerce.holdMinutes === 'number') {
      next.commerce.holdMinutes = Math.max(5, Math.min(60, body.commerce.holdMinutes))
    }
    if (typeof body.commerce.commissionPercent === 'number') {
      next.commerce.commissionPercent = Math.max(0, Math.min(30, body.commerce.commissionPercent))
    }
    if (typeof body.commerce.siteUrl === 'string' && body.commerce.siteUrl.trim()) {
      next.commerce.siteUrl = body.commerce.siteUrl.trim().replace(/\/$/, '')
    }
  }

  next.updatedAt = new Date().toISOString()
  return next
}

export function toAdminFormView(s: SettingsStore) {
  return {
    seatsio: {
      workspacePublicKey: s.seatsio.workspacePublicKey,
      secretKey: maskSecret(s.seatsio.secretKey),
      region: s.seatsio.region,
      workspacePublicKeySet: !!s.seatsio.workspacePublicKey,
      secretKeySet: !!s.seatsio.secretKey
    },
    stripe: {
      publishableKey: s.stripe.publishableKey,
      secretKey: maskSecret(s.stripe.secretKey),
      webhookSecret: maskSecret(s.stripe.webhookSecret),
      publishableKeySet: !!s.stripe.publishableKey,
      secretKeySet: !!s.stripe.secretKey,
      webhookSecretSet: !!s.stripe.webhookSecret,
      connect: {
        ...s.stripe.connect,
        configured: !!(s.stripe.connect.platformAccountId && s.stripe.connect.connectedAccountId)
      }
    },
    otpVpos: {
      merchantId: s.otpVpos.merchantId,
      apiKey: maskSecret(s.otpVpos.apiKey),
      endpoint: s.otpVpos.endpoint,
      enabled: s.otpVpos.enabled,
      apiKeySet: !!s.otpVpos.apiKey,
      configured: !!(s.otpVpos.merchantId && s.otpVpos.apiKey)
    },
    email: {
      provider: s.email.provider,
      from: s.email.from,
      smtpHost: s.email.smtpHost,
      smtpPort: s.email.smtpPort,
      smtpUser: s.email.smtpUser,
      smtpPass: maskSecret(s.email.smtpPass),
      smtpSecure: s.email.smtpSecure,
      resendApiKey: maskSecret(s.email.resendApiKey),
      smtpPassSet: !!s.email.smtpPass,
      resendApiKeySet: !!s.email.resendApiKey,
      ready:
        s.email.provider === 'log' ||
        (s.email.provider === 'smtp' && !!s.email.smtpHost && !!s.email.from) ||
        (s.email.provider === 'resend' && !!s.email.resendApiKey && !!s.email.from)
    },
    company: { ...s.company },
    commerce: { ...s.commerce },
    updatedAt: s.updatedAt,
    ready: {
      seatsioChart: !!s.seatsio.workspacePublicKey,
      seatsioBook: !!s.seatsio.secretKey,
      stripeCheckout: !!(s.stripe.secretKey && s.stripe.publishableKey),
      stripeConnect: !!(s.stripe.connect.enabled && s.stripe.connect.connectedAccountId),
      otpVpos: !!(s.otpVpos.enabled && s.otpVpos.merchantId && s.otpVpos.apiKey),
      email:
        s.email.provider === 'log' ||
        (s.email.provider === 'smtp' && !!s.email.smtpHost) ||
        (s.email.provider === 'resend' && !!s.email.resendApiKey)
    }
  }
}

export function toPublicIntegrations(s: SettingsStore) {
  return {
    seatsio: {
      workspacePublicKey: s.seatsio.workspacePublicKey || null,
      region: s.seatsio.region,
      enabled: !!s.seatsio.workspacePublicKey
    },
    stripe: {
      publishableKey: s.stripe.publishableKey || null,
      enabled: !!(s.stripe.secretKey && s.stripe.publishableKey)
    },
    otpVpos: {
      enabled: !!(s.otpVpos.enabled && s.otpVpos.merchantId && s.otpVpos.apiKey)
    },
    holdMinutes: s.commerce.holdMinutes,
    currency: s.commerce.currency
  }
}

export function toPublicCompany(s: SettingsStore) {
  return { ...s.company }
}
