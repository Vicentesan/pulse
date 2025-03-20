export interface PlaidAccount {
  account_id: string
  balances: {
    available: number
    current: number
    limit?: number
    iso_currency_code: string | null
    unofficial_currency_code: string | null
  }
  mask: string
  name: string
  official_name: string | null
  type: string
  subtype: string | null
  verification_status: string | null
}

export interface PlaidTransaction {
  account_id: string
  amount: number
  iso_currency_code: string | null
  unofficial_currency_code: string | null
  category: string[] | null
  category_id: string | null
  check_number: string | null
  date: string
  datetime: string | null
  authorized_date: string | null
  location: {
    address: string | null
    city: string | null
    region: string | null
    postal_code: string | null
    country: string | null
    lat: number | null
    lon: number | null
    store_number: string | null
  } | null
  name: string
  merchant_name: string | null
  merchant_entity_id: string | null
  original_description: string | null
  payment_channel: string
  pending: boolean
  pending_transaction_id: string | null
  account_owner: string | null
  transaction_id: string
  transaction_type: string | null
  website: string | null
}

export interface PlaidLinkTokenResponse {
  link_token: string
  expiration: string
  request_id: string
}

export interface PlaidExchangeTokenResponse {
  access_token: string
  item_id: string
  request_id: string
}
