import { Account, Transaction } from './types'

export type Provider = string

export interface PulseAdapter<P extends Provider = Provider> {
  readonly provider: P
  connect(params: { userId: string }): Promise<void>
  disconnect(params: object): Promise<void>
  getAccounts(params: object): Promise<Account[]>
  getTransactions(params: { accountId: string }): Promise<Transaction[]>
  refreshAccounts(params: { userId: string }): Promise<void>
}

export interface PulseOptions<P extends Provider> {
  adapters: PulseAdapter<P>[]
}

export interface PulseAdapterConfig {
  clientId?: string
  clientSecret?: string
  apiKey?: string
  baseUrl?: string
  [key: string]: unknown
}

// Base class for implementing adapters
export abstract class BasePulseAdapter<P extends Provider = Provider>
  implements PulseAdapter<P>
{
  abstract readonly provider: P
  protected config: PulseAdapterConfig

  constructor(config: PulseAdapterConfig) {
    this.config = config
  }

  abstract connect(params: { userId: string }): Promise<void>
  abstract disconnect(params: object): Promise<void>
  abstract getAccounts(params: object): Promise<Account[]>
  abstract getTransactions(params: {
    accountId: string
  }): Promise<Transaction[]>

  async refreshAccounts(params: { userId: string }): Promise<void> {
    await this.disconnect({})
    await this.connect({ userId: params.userId })
  }
}

export interface PulseConfig {
  baseUrl?: string
  apiKey: string
}
