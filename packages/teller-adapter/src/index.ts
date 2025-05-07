/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type Account,
  AccountType,
  BasePulseAdapter,
  type BasePulseAdapterConfig,
  ConnectParams,
  DisconnectParams,
  ErrorCode,
  GetAccountsParams,
  GetTransactionsParams,
  PulseError,
  Transaction,
  TransactionType,
} from '@pulse/sdk'

import {
  TellerAccountSchema,
  TellerConnectResponseSchema,
  TellerTransactionSchema,
} from './schemas'

export interface TellerAdapterConfig extends BasePulseAdapterConfig {
  apiKey: string
  webhookUrl?: string
  products?: string[]
  environment?: 'production' | 'development' | 'sandbox'
  clientSecret?: string
  timeout?: number
}

/**
 * TellerAdapter provides integration with Teller's financial data APIs.
 */
export class TellerAdapter extends BasePulseAdapter<
  'teller',
  TellerAdapterConfig
> {
  readonly provider = 'teller' as const
  private apiUrl = 'https://api.teller.io'
  private accessTokens: Record<string, string> = {}
  private webhookUrl?: string
  private environment?: 'production' | 'development' | 'sandbox'
  private clientSecret?: string
  private timeout?: number

  /**
   * Creates a new TellerAdapter instance.
   *
   * @param config - Configuration options for the adapter
   */
  constructor(config: TellerAdapterConfig) {
    super(config)
    if (!this.config.apiKey) {
      throw new PulseError(
        'Teller API key is required',
        ErrorCode.CONFIGURATION_ERROR,
        { provider: 'teller' },
      )
    }

    if (this.config.webhookUrl) this.webhookUrl = this.config.webhookUrl
    if (this.config.environment) this.environment = this.config.environment
    if (this.config.clientSecret) this.clientSecret = this.config.clientSecret
    if (this.config.timeout) this.timeout = this.config.timeout
  }

  /**
   * Stores the access token received after successful authentication with Teller Connect.
   *
   * @param userId - The user ID associated with the token
   * @param accessToken - The access token received from Teller Connect
   * @returns A promise that resolves when the token is stored
   */
  async storeAccessToken(userId: string, accessToken: string): Promise<void> {
    this.accessTokens[userId] = accessToken
  }

  /**
   * Connects a user to Teller.
   *
   * @param params - Connection parameters including userId
   * @returns A promise that resolves when the connection is established
   * @throws {PulseError} If the connection fails
   */
  async connect(params: ConnectParams): Promise<void> {
    try {
      const { userId, onConnectTokenCreated } = params

      // Create a Teller Connect token for the user
      const response = await fetch(`${this.apiUrl}/connect/token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          products: this.config.products || [
            'transactions',
            'balance',
            'identity',
          ],
        }),
      })

      if (!response.ok) {
        throw new PulseError(
          `Teller API error: ${response.statusText}`,
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'teller', userId },
        )
      }

      const data = await response.json()
      const parsedData = TellerConnectResponseSchema.parse(data)

      // If a callback was provided, use it to pass the connect token back
      if (
        typeof onConnectTokenCreated === 'function' &&
        parsedData.connect_token
      ) {
        onConnectTokenCreated(parsedData.connect_token)
      } else if (parsedData.connect_token) {
        console.warn(
          `Connect token created for user ${userId}, but no callback was provided to handle it.`,
        )
        console.warn(
          'The client needs this token to initialize Teller Connect.',
        )
      } else {
        throw new PulseError(
          'No connect token found in Teller response',
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'teller', userId },
        )
      }
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to connect to Teller: ${errorMessage}`,
        ErrorCode.PROVIDER_CONNECTION_FAILED,
        { provider: 'teller', userId: params.userId },
      )
    }
  }

  /**
   * Disconnects a user from Teller.
   *
   * @param params - Disconnection parameters including userId
   * @returns A promise that resolves when the disconnection is complete
   * @throws {PulseError} If the disconnection fails
   */
  async disconnect(params: DisconnectParams): Promise<void> {
    try {
      const { userId } = params

      if (!userId) {
        // If no userId provided, disconnect all users
        for (const id of Object.keys(this.accessTokens)) {
          await this.disconnectUser(id)
        }
        return
      }

      await this.disconnectUser(userId)
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to disconnect from Teller: ${errorMessage}`,
        ErrorCode.PROVIDER_DISCONNECTION_FAILED,
        { provider: 'teller', userId: params.userId },
      )
    }
  }

  /**
   * Helper method to disconnect a specific user.
   */
  private async disconnectUser(userId: string): Promise<void> {
    const accessToken = this.accessTokens[userId]
    if (!accessToken) return

    try {
      // Revoke the access token
      const response = await fetch(`${this.apiUrl}/connect/token/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: accessToken,
        }),
      })

      if (!response.ok) {
        throw new PulseError(
          `Failed to revoke Teller token: ${response.statusText}`,
          ErrorCode.PROVIDER_DISCONNECTION_FAILED,
          { provider: 'teller', userId },
        )
      }
    } finally {
      // Always remove the token even if the API call fails
      delete this.accessTokens[userId]
    }
  }

  /**
   * Gets accounts for a user.
   *
   * @param params - Parameters including userId
   * @returns A promise that resolves to an array of accounts
   * @throws {PulseError} If fetching accounts fails
   */
  async getAccounts(params: GetAccountsParams): Promise<Account[]> {
    try {
      const { userId } = params

      if (!userId) {
        throw new PulseError(
          'User ID is required to fetch accounts',
          ErrorCode.VALIDATION_ERROR,
          { provider: 'teller' },
        )
      }

      const accessToken = this.accessTokens[userId]
      if (!accessToken) {
        throw new PulseError(
          `Not connected to Teller for user ${userId}`,
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'teller', userId },
        )
      }

      const response = await fetch(`${this.apiUrl}/accounts`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accessToken}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new PulseError(
          `Teller API error: ${response.statusText}`,
          ErrorCode.ACCOUNT_FETCH_FAILED,
          { provider: 'teller', userId },
        )
      }

      const data = await response.json()
      const accounts = TellerAccountSchema.array().parse(data)

      return accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: this.#mapAccountType(account.type),
        balance: parseFloat(account.balances.current),
        currency: account.currency.toUpperCase(),
        lastUpdated: account.last_updated,
        metadata: {
          institution: account.institution,
          enrollment_id: account.enrollment_id,
          status: account.status,
          links: account.links,
        },
      }))
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to fetch accounts: ${errorMessage}`,
        ErrorCode.ACCOUNT_FETCH_FAILED,
        { provider: 'teller', userId: params.userId },
      )
    }
  }

  /**
   * Gets transactions for an account.
   *
   * @param params - Parameters including accountId and userId
   * @returns A promise that resolves to an array of transactions
   * @throws {PulseError} If fetching transactions fails
   */
  async getTransactions(params: GetTransactionsParams): Promise<Transaction[]> {
    try {
      const { accountId, userId } = params

      if (!userId) {
        throw new PulseError(
          'User ID is required to fetch transactions',
          ErrorCode.VALIDATION_ERROR,
          { provider: 'teller', accountId },
        )
      }

      const accessToken = this.accessTokens[userId]
      if (!accessToken) {
        throw new PulseError(
          `Not connected to Teller for user ${userId}`,
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'teller', userId, accountId },
        )
      }

      const response = await fetch(
        `${this.apiUrl}/accounts/${accountId}/transactions`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${accessToken}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new PulseError(
          `Teller API error: ${response.statusText}`,
          ErrorCode.TRANSACTION_FETCH_FAILED,
          { provider: 'teller', userId, accountId },
        )
      }

      const data = await response.json()
      const transactions = TellerTransactionSchema.array().parse(data)

      // Filter out pending transactions
      const filteredTransactions = transactions.filter(
        (transaction) => transaction.status !== 'pending',
      )

      return filteredTransactions.map((transaction) => ({
        id: transaction.id,
        accountId: transaction.account_id,
        amount: Math.abs(parseFloat(transaction.amount)),
        currency: 'USD', // Teller primarily works with US banks
        description: transaction.description,
        category: transaction.details.category,
        type:
          parseFloat(transaction.amount) < 0
            ? TransactionType.DEBIT
            : TransactionType.CREDIT,
        date: transaction.date,
        metadata: {
          status: transaction.status,
          type: transaction.type,
          running_balance: transaction.running_balance,
          details: transaction.details,
          links: transaction.links,
        },
      }))
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to fetch transactions: ${errorMessage}`,
        ErrorCode.TRANSACTION_FETCH_FAILED,
        { provider: 'teller', accountId: params.accountId },
      )
    }
  }

  /**
   * Maps Teller account types to Pulse account types.
   *
   * @param tellerType - The Teller account type
   * @returns The corresponding Pulse account type
   */
  #mapAccountType(tellerType: string): AccountType {
    const typeMap: Record<string, AccountType> = {
      depository: AccountType.CHECKING,
      credit: AccountType.CREDIT,
      investment: AccountType.INVESTMENT,
      loan: AccountType.LOAN,
      mortgage: AccountType.LOAN,
      savings: AccountType.SAVINGS,
    }

    return typeMap[tellerType.toLowerCase()] || AccountType.OTHER
  }
}
