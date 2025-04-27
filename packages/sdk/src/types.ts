export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT = 'CREDIT',
  INVESTMENT = 'INVESTMENT',
  LOAN = 'LOAN',
  CRYPTO = 'CRYPTO',
  OTHER = 'OTHER',
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  lastUpdated: string
  metadata?: Record<string, unknown>
}

export interface Transaction {
  id: string
  accountId: string
  amount: number
  currency: string
  description: string
  category?: string
  type: TransactionType
  date: string
  metadata?: Record<string, unknown>
}

export enum ErrorCode {
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_CONNECTION_FAILED = 'PROVIDER_CONNECTION_FAILED',
  PROVIDER_DISCONNECTION_FAILED = 'PROVIDER_DISCONNECTION_FAILED',
  ACCOUNT_FETCH_FAILED = 'ACCOUNT_FETCH_FAILED',
  TRANSACTION_FETCH_FAILED = 'TRANSACTION_FETCH_FAILED',
  ACCOUNT_REFRESH_FAILED = 'ACCOUNT_REFRESH_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class PulseError extends Error {
  code: ErrorCode
  provider?: string
  userId?: string
  accountId?: string

  constructor(
    message: string,
    code: ErrorCode,
    metadata?: {
      provider?: string
      userId?: string
      accountId?: string
    },
  ) {
    super(message)
    this.name = 'PulseError'
    this.code = code
    this.provider = metadata?.provider
    this.userId = metadata?.userId
    this.accountId = metadata?.accountId
  }
}

export interface TransactionHistoryOptions {
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}
