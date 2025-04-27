import {
  Account,
  ErrorCode,
  PulseError,
  Transaction,
  TransactionHistoryOptions,
} from './types'

export type Provider = string

export interface ConnectParams {
  userId: string
  [key: string]: unknown
}

export interface DisconnectParams {
  userId?: string
  [key: string]: unknown
}

export interface GetAccountsParams {
  userId?: string
  [key: string]: unknown
}

export interface GetTransactionsParams {
  accountId: string
  options?: TransactionHistoryOptions
  [key: string]: unknown
}

export interface RefreshAccountsParams {
  userId: string
  [key: string]: unknown
}

export interface PulseAdapter<P extends Provider = Provider> {
  readonly provider: P
  connect(params: ConnectParams): Promise<void>
  disconnect(params: DisconnectParams): Promise<void>
  getAccounts(params: GetAccountsParams): Promise<Account[]>
  getTransactions(params: GetTransactionsParams): Promise<Transaction[]>
  refreshAccounts(params: RefreshAccountsParams): Promise<void>
}

export interface PulseOptions<P extends Provider> {
  adapters: PulseAdapter<P>[]
  defaultProvider?: P
}

export interface PulseAdapterConfig {
  clientId?: string
  clientSecret?: string
  apiKey?: string
  baseUrl?: string
  environment?: 'production' | 'development' | 'sandbox'
  debug?: boolean
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

  abstract connect(params: ConnectParams): Promise<void>
  abstract disconnect(params: DisconnectParams): Promise<void>
  abstract getAccounts(params: GetAccountsParams): Promise<Account[]>
  abstract getTransactions(
    params: GetTransactionsParams,
  ): Promise<Transaction[]>

  async refreshAccounts(params: RefreshAccountsParams): Promise<void> {
    try {
      await this.disconnect({ userId: params.userId })
      await this.connect({ userId: params.userId })
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to refresh accounts: ${errorMessage}`,
        ErrorCode.ACCOUNT_REFRESH_FAILED,
        { provider: this.provider, userId: params.userId },
      )
    }
  }
}

export interface PulseConfig {
  baseUrl?: string
  apiKey: string
}
