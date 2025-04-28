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
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from 'plaid'

import { PlaidAccountSchema, PlaidTransactionSchema } from './schemas'

export interface PlaidAdapterConfig extends BasePulseAdapterConfig {
  clientId: string
  webhookUrl?: string
  products?: string[]
  countryCodes?: string[]
  language?: string
}
/**
 * PlaidAdapter provides integration with Plaid's financial data APIs.
 *
 * @example
 * ```typescript
 * const plaidAdapter = new PlaidAdapter({
 *   clientId: 'your-client-id',
 *   apiKey: 'your-plaid-api-key',
 *   environment: 'sandbox'
 * })
 * ```
 */
export class PlaidAdapter extends BasePulseAdapter<
  'plaid',
  PlaidAdapterConfig
> {
  readonly provider = 'plaid' as const
  private client: PlaidApi
  private accessTokens: Record<string, string> = {}

  constructor(config: PlaidAdapterConfig) {
    super(config)

    // Use the config through the public property
    if (!this.config.apiKey) {
      throw new PulseError(
        'Plaid API key is required',
        ErrorCode.CONFIGURATION_ERROR,
        { provider: 'plaid' },
      )
    }

    if (!this.config.clientId) {
      throw new PulseError(
        'Plaid client ID is required',
        ErrorCode.CONFIGURATION_ERROR,
        { provider: 'plaid' },
      )
    }

    // Initialize Plaid client with the config
    const configuration = new Configuration({
      basePath:
        PlaidEnvironments[
          this.config.environment === 'production' ? 'production' : 'sandbox'
        ],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.config.clientId,
          'PLAID-SECRET': this.config.apiKey,
        },
      },
    })

    this.client = new PlaidApi(configuration)
  }

  /**
   * Exchanges a public token for an access token after user authentication.
   *
   * @param userId - The user ID associated with the token
   * @param publicToken - The public token received from Plaid Link
   * @returns A promise that resolves when the exchange is complete
   * @throws {PulseError} If the token exchange fails
   */
  async exchangePublicToken(
    userId: string,
    publicToken: string,
  ): Promise<void> {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      })

      if (!response.data.access_token) {
        throw new PulseError(
          'No access token received from Plaid',
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'plaid', userId },
        )
      }

      // Store the access token for future API calls
      this.accessTokens[userId] = response.data.access_token
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to exchange public token: ${errorMessage}`,
        ErrorCode.PROVIDER_CONNECTION_FAILED,
        { provider: 'plaid', userId },
      )
    }
  }

  /**
   * Connects a user to Plaid.
   *
   * @param params - Connection parameters including userId
   * @returns A promise that resolves when the connection is established
   * @throws {PulseError} If the connection fails
   */
  async connect(params: ConnectParams): Promise<void> {
    try {
      const { userId, onConnectTokenCreated } = params

      // Create a link token for the user
      const response = await this.client.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'Pulse',
        products: [Products.Transactions, Products.Balance],
        country_codes: [CountryCode.Us],
        language: 'en',
      })

      const data = response.data
      if (!data.link_token) {
        throw new PulseError(
          'Failed to create link token',
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'plaid', userId },
        )
      }

      // If a callback was provided, use it to pass the link token back
      if (typeof onConnectTokenCreated === 'function') {
        onConnectTokenCreated(data.link_token)
      } else {
        console.warn(
          `Link token created for user ${userId}, but no callback was provided to handle it.`,
        )
        console.warn(
          'The client needs this token to complete the authentication flow.',
        )
      }
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to connect to Plaid: ${errorMessage}`,
        ErrorCode.PROVIDER_CONNECTION_FAILED,
        { provider: 'plaid', userId: params.userId },
      )
    }
  }

  /**
   * Disconnects a user from Plaid.
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
        `Failed to disconnect from Plaid: ${errorMessage}`,
        ErrorCode.PROVIDER_DISCONNECTION_FAILED,
        { provider: 'plaid', userId: params.userId },
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
      // Remove the item (disconnect the account)
      await this.client.itemRemove({
        access_token: accessToken,
      })
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
          { provider: 'plaid' },
        )
      }

      const accessToken = this.accessTokens[userId]
      if (!accessToken) {
        throw new PulseError(
          `Not connected to Plaid for user ${userId}`,
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'plaid', userId },
        )
      }

      const response = await this.client.accountsGet({
        access_token: accessToken,
      })

      const accounts = response.data.accounts.map((account) =>
        PlaidAccountSchema.parse(account),
      )

      return accounts.map((account) => ({
        id: account.account_id,
        name: account.name,
        type: this.mapAccountType(account.type),
        balance: account.balances.current,
        currency: account.balances.iso_currency_code?.toUpperCase() || 'USD',
        lastUpdated: new Date().toISOString(),
        metadata: {
          mask: account.mask,
          officialName: account.official_name,
          subtype: account.subtype,
          verificationStatus: account.verification_status,
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
        { provider: 'plaid', userId: params.userId },
      )
    }
  }

  /**
   * Gets transactions for an account.
   *
   * @param params - Parameters including accountId and optional transaction history options
   * @returns A promise that resolves to an array of transactions
   * @throws {PulseError} If fetching transactions fails
   */
  async getTransactions(params: GetTransactionsParams): Promise<Transaction[]> {
    try {
      const { accountId, options, userId } = params

      if (!userId) {
        throw new PulseError(
          'User ID is required to fetch transactions',
          ErrorCode.VALIDATION_ERROR,
          { provider: 'plaid', accountId },
        )
      }

      const accessToken = this.accessTokens[userId]
      if (!accessToken) {
        throw new PulseError(
          `Not connected to Plaid for user ${userId}`,
          ErrorCode.PROVIDER_CONNECTION_FAILED,
          { provider: 'plaid', userId, accountId },
        )
      }

      // Calculate date range
      const endDate = options?.endDate || new Date()
      const startDate =
        options?.startDate ||
        new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // Default to 30 days

      const response = await this.client.transactionsGet({
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        options: {
          account_ids: [accountId],
          count: options?.limit || 100,
          offset: options?.offset || 0,
        },
      })

      const transactions = response.data.transactions.map((transaction) =>
        PlaidTransactionSchema.parse(transaction),
      )

      // Filter out pending transactions
      const filteredTransactions = transactions.filter(
        (transaction) => !transaction.pending,
      )

      return filteredTransactions.map((transaction) => ({
        id: transaction.transaction_id,
        accountId: transaction.account_id,
        amount: Math.abs(transaction.amount),
        currency: transaction.iso_currency_code?.toUpperCase() || 'USD',
        description: transaction.name,
        category: transaction.category?.[0],
        type:
          transaction.amount < 0
            ? TransactionType.DEBIT
            : TransactionType.CREDIT,
        date: transaction.date,
        metadata: {
          merchantName: transaction.merchant_name,
          paymentChannel: transaction.payment_channel,
          location: transaction.location,
          categories: transaction.category,
          originalDescription: transaction.original_description,
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
        { provider: 'plaid', accountId: params.accountId },
      )
    }
  }

  /**
   * Maps Plaid account types to Pulse account types.
   *
   * @param plaidType - The Plaid account type
   * @returns The corresponding Pulse account type
   */
  private mapAccountType(plaidType: string): AccountType {
    const typeMap: Record<string, AccountType> = {
      depository: AccountType.CHECKING,
      credit: AccountType.CREDIT,
      investment: AccountType.INVESTMENT,
      loan: AccountType.LOAN,
      mortgage: AccountType.LOAN,
      savings: AccountType.SAVINGS,
    }

    return typeMap[plaidType.toLowerCase()] || AccountType.OTHER
  }
}
