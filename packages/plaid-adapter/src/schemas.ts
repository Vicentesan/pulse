import { z } from 'zod'

export const PlaidLocationSchema = z.object({
  address: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  store_number: z.string().nullable(),
})

export const PlaidBalancesSchema = z.object({
  available: z.number(),
  current: z.number(),
  limit: z.number().optional(),
  iso_currency_code: z.string().nullable(),
  unofficial_currency_code: z.string().nullable(),
})

export const PlaidAccountSchema = z.object({
  account_id: z.string(),
  balances: PlaidBalancesSchema,
  mask: z.string(),
  name: z.string(),
  official_name: z.string().nullable(),
  type: z.string(),
  subtype: z.string().nullable(),
  verification_status: z.string().nullable(),
})

export const PlaidTransactionSchema = z.object({
  account_id: z.string(),
  amount: z.number(),
  iso_currency_code: z.string().nullable(),
  unofficial_currency_code: z.string().nullable(),
  category: z.array(z.string()).nullable(),
  category_id: z.string().nullable(),
  check_number: z.string().nullable(),
  date: z.string(),
  datetime: z.string().nullable(),
  authorized_date: z.string().nullable(),
  location: PlaidLocationSchema.nullable(),
  name: z.string(),
  merchant_name: z.string().nullable(),
  merchant_entity_id: z.string().nullable(),
  original_description: z.string().nullable(),
  payment_channel: z.string(),
  pending: z.boolean(),
  pending_transaction_id: z.string().nullable(),
  account_owner: z.string().nullable(),
  transaction_id: z.string(),
  transaction_type: z.string().nullable(),
  website: z.string().nullable(),
})

export const PlaidLinkTokenResponseSchema = z.object({
  link_token: z.string(),
  expiration: z.string(),
  request_id: z.string(),
})

export const PlaidExchangeTokenResponseSchema = z.object({
  access_token: z.string(),
  item_id: z.string(),
  request_id: z.string(),
})

export type PlaidAccount = z.infer<typeof PlaidAccountSchema>
export type PlaidTransaction = z.infer<typeof PlaidTransactionSchema>
export type PlaidLinkTokenResponse = z.infer<
  typeof PlaidLinkTokenResponseSchema
>
export type PlaidExchangeTokenResponse = z.infer<
  typeof PlaidExchangeTokenResponseSchema
>
