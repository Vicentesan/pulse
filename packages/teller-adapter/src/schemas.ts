import { z } from 'zod'

export const TellerCounterpartySchema = z.object({
  name: z.string().nullable(),
  type: z.enum(['organization', 'person']).nullable(),
})

export const TellerTransactionDetailsSchema = z.object({
  category: z.string().optional(),
  counterparty: TellerCounterpartySchema.optional(),
  processing_status: z.enum(['pending', 'complete']),
})

export const TellerLinksSchema = z.object({
  self: z.string().url(),
  account: z.string().url(),
})

export const TellerTransactionSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  date: z.string(),
  amount: z.string(),
  description: z.string(),
  status: z.enum(['posted', 'pending']),
  type: z.string(),
  running_balance: z.string().nullable(),
  details: TellerTransactionDetailsSchema,
  links: TellerLinksSchema,
})

export const TellerBalancesSchema = z.object({
  available: z.string(),
  current: z.string(),
  ledger: z.string(),
})

export const TellerInstitutionSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const TellerAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  balances: TellerBalancesSchema,
  currency: z.string(),
  enrollment_id: z.string(),
  institution: TellerInstitutionSchema,
  last_updated: z.string(),
  links: z.object({
    self: z.string().url(),
    balances: z.string().url(),
    transactions: z.string().url(),
  }),
  status: z.enum(['open', 'closed']),
})

export const TellerConnectResponseSchema = z.object({
  connect_token: z.string(),
})

export type TellerTransaction = z.infer<typeof TellerTransactionSchema>
export type TellerAccount = z.infer<typeof TellerAccountSchema>
export type TellerConnectResponse = z.infer<typeof TellerConnectResponseSchema>
