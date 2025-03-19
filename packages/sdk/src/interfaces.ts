import { Account, Transaction } from './types'

export interface PulseAdapter {
  readonly provider: string
  connect(userId: string): Promise<void>
  disconnect(userId: string): Promise<void>
  getAccounts(userId: string): Promise<Account[]>
  getTransactions(userId: string, accountId: string): Promise<Transaction[]>
  refreshAccounts(userId: string): Promise<void>
}

export interface PulseAdapterConfig {
  clientId?: string
  clientSecret?: string
  apiKey?: string
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

  abstract connect(userId: string): Promise<void>
  abstract disconnect(userId: string): Promise<void>
  abstract getAccounts(userId: string): Promise<Account[]>
  abstract getTransactions(
    userId: string,
    accountId: string,
  ): Promise<Transaction[]>

  async refreshAccounts(userId: string): Promise<void> {
    // Default implementation - can be overridden by specific adapters
    await this.disconnect(userId)
    await this.connect(userId)
  }
}

export interface PulseConfig {
  baseUrl?: string
  apiKey: string
}
