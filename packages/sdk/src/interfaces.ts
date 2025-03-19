import { Account, Transaction } from './types'

export interface PulseAdapter {
  provider: string
  getAccounts(userId: string): Promise<Account[]>
  getTransactions(userId: string, accountId: string): Promise<Transaction[]>
}

export interface PulseAdapterConfig {
  clientId?: string
  clientSecret?: string
  apiKey?: string
  [key: string]: unknown
}

export interface PulseOptions {
  adapters?: PulseAdapter[]
  config: PulseConfig
}

export interface PulseConfig {
  baseUrl?: string
  apiKey: string
} 