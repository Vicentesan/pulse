import { Account, Transaction } from './types'

export interface PulseAdapter {
  readonly provider: string
  connect({
    userId,
    provider,
  }: {
    userId: string
    provider?: 'teller'
  }): Promise<void>
  disconnect({ provider }: { provider?: 'teller' }): Promise<void>
  getAccounts({ provider }: { provider?: 'teller' }): Promise<Account[]>
  getTransactions({
    accountId,
    provider,
  }: {
    accountId: string
    provider?: 'teller'
  }): Promise<Transaction[]>
  refreshAccounts({
    userId,
    provider,
  }: {
    userId: string
    provider?: 'teller'
  }): Promise<void>
}

export interface PulseAdapterConfig {
  clientId?: 'teller'
  clientSecret?: 'teller'
  apiKey?: 'teller'
  [key: string]: unknown
}

export interface PulseOptions {
  adapters: PulseAdapter[]
}

// Base class for implementing adapters
export abstract class BasePulseAdapter implements PulseAdapter {
  abstract readonly provider: string
  protected config: PulseAdapterConfig

  constructor(config: PulseAdapterConfig) {
    this.config = config
  }

  abstract connect({ userId }: { userId: string }): Promise<void>
  abstract disconnect(): Promise<void>
  abstract getAccounts(): Promise<Account[]>
  abstract getTransactions({
    userId,
    accountId,
  }: {
    userId: string
    accountId: string
  }): Promise<Transaction[]>

  async refreshAccounts({ userId }: { userId: string }): Promise<void> {
    // Default implementation - can be overridden by specific adapters
    await this.disconnect()
    await this.connect({ userId })
  }
}

export interface PulseConfig {
  baseUrl?: 'teller'
  apiKey: string
}
