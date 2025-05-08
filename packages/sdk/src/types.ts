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
  METHOD_NOT_SUPPORTED = 'METHOD_NOT_SUPPORTED',
}

export class PulseError extends Error {
  code: ErrorCode
  provider?: string
  userId?: string
  accountId?: string
  method?: string
  details?: Record<string, unknown>

  constructor(
    message: string,
    code: ErrorCode,
    metadata?: {
      provider?: string
      userId?: string
      accountId?: string
      method?: string
      details?: Record<string, unknown>
    },
  ) {
    super(message)
    this.name = 'PulseError'

    Object.setPrototypeOf(this, new.target.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PulseError)
    }

    this.code = code
    this.provider = metadata?.provider
    this.userId = metadata?.userId
    this.accountId = metadata?.accountId
    this.method = metadata?.method
    this.details = metadata?.details
  }

  /**
   * Creates a formatted error message with all relevant metadata
   */
  toDetailedString(): string {
    const parts = [`PulseError: ${this.message}`, `Code: ${this.code}`]

    if (this.provider) parts.push(`Provider: ${this.provider}`)
    if (this.method) parts.push(`Method: ${this.method}`)
    if (this.userId) parts.push(`User ID: ${this.userId}`)
    if (this.accountId) parts.push(`Account ID: ${this.accountId}`)
    if (this.details && Object.keys(this.details).length > 0) {
      parts.push(`Details: ${JSON.stringify(this.details)}`)
    }

    return parts.join('\n')
  }
}

export interface TransactionHistoryOptions {
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}
