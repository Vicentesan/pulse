export interface TellerAccount {
  id: string
  name: string
  type: string
  balances: {
    available: string
    current: string
    ledger: string
  }
  currency: string
  enrollment_id: string
  institution: {
    id: string
    name: string
  }
  last_updated: string
  links: {
    self: string
    balances: string
    transactions: string
  }
  status: 'open' | 'closed'
}

export interface TellerTransaction {
  id: string
  account_id: string
  date: string
  amount: string
  description: string
  status: 'posted' | 'pending'
  type: string
  running_balance: string | null
  details: {
    category?: string
    counterparty?: {
      name: string
      type: 'organization' | 'person'
    }
    processing_status: 'pending' | 'complete'
  }
  links: {
    self: string
    account: string
  }
}
