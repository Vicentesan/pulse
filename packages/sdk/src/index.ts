import {
  ConnectParams,
  DisconnectParams,
  GetAccountsParams,
  GetTransactionsParams,
  Provider,
  PulseAdapter,
  PulseOptions,
  RefreshAccountsParams,
} from './interfaces'
import {
  Account,
  ErrorCode,
  PulseError,
  Transaction,
  TransactionHistoryOptions,
} from './types'

/**
 * Pulse is a unified SDK for financial data providers.
 * It provides a consistent interface to interact with multiple financial data sources.
 *
 * @example
 * ```typescript
 * const pulse = new Pulse({
 *   adapters: [
 *     new PlaidAdapter({ apiKey: 'your-plaid-api-key' }),
 *     new CryptoAdapter({
 *       ethNodeUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
 *       btcNodeUrl: 'https://blockstream.info/api'
 *     })
 *   ]
 * })
 * ```
 */
export class Pulse<P extends Provider> {
  private adapters: Map<P, PulseAdapter<P>>
  private defaultProvider?: P

  /**
   * Creates a new Pulse instance.
   *
   * @param options - Configuration options including adapters
   */
  constructor(options: PulseOptions<P>) {
    if (!options.adapters || options.adapters.length === 0) {
      throw new PulseError(
        'At least one adapter must be provided',
        ErrorCode.CONFIGURATION_ERROR,
      )
    }

    this.adapters = new Map()
    options.adapters.forEach((adapter) => {
      this.adapters.set(adapter.provider, adapter)
    })

    this.defaultProvider = options.defaultProvider
  }

  /**
   * Gets an adapter for the specified provider.
   *
   * @param params - Parameters including optional provider
   * @returns The adapter for the specified provider
   * @throws {PulseError} If the provider is not found
   */
  private getAdapter(params: { provider?: P }): PulseAdapter<P> {
    if (params.provider) {
      const adapter = this.adapters.get(params.provider)
      if (!adapter) {
        throw new PulseError(
          `Provider ${params.provider} not found`,
          ErrorCode.PROVIDER_NOT_FOUND,
          { provider: params.provider as string },
        )
      }
      return adapter
    }

    if (this.defaultProvider) {
      const adapter = this.adapters.get(this.defaultProvider)
      if (adapter) return adapter
    }

    return Array.from(this.adapters.values())[0]
  }

  /**
   * Connects to a financial data provider.
   *
   * @param userId - The user ID to connect
   * @param provider - Optional provider to connect to
   * @param additionalParams - Additional parameters for the connection
   * @returns A promise that resolves when the connection is established
   * @throws {PulseError} If the connection fails
   *
   * @example
   * ```typescript
   * // Connect to a specific provider
   * await pulse.connect('user-123', 'plaid')
   *
   * // Connect to crypto provider with wallet addresses
   * await pulse.connect('user-123', 'crypto', {
   *   addresses: {
   *     ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
   *     bitcoin: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
   *   }
   * })
   * ```
   */
  async connect(
    userId: string,
    provider?: P,
    additionalParams: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      const connectParams: ConnectParams = {
        userId,
        ...additionalParams,
      }

      if (provider) {
        await this.getAdapter({ provider }).connect(connectParams)
        return
      }

      await Promise.all(
        Array.from(this.adapters.values()).map((adapter) =>
          adapter.connect(connectParams),
        ),
      )
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to connect: ${errorMessage}`,
        ErrorCode.PROVIDER_CONNECTION_FAILED,
        { provider: provider as string, userId },
      )
    }
  }

  /**
   * Disconnects from a financial data provider.
   *
   * @param userId - The user ID to disconnect
   * @param provider - Optional provider to disconnect from
   * @returns A promise that resolves when the disconnection is complete
   * @throws {PulseError} If the disconnection fails
   *
   * @example
   * ```typescript
   * await pulse.disconnect('user-123', 'plaid')
   * ```
   */
  async disconnect(userId: string, provider?: P): Promise<void> {
    try {
      const disconnectParams: DisconnectParams = { userId }

      if (provider) {
        await this.getAdapter({ provider }).disconnect(disconnectParams)
        return
      }

      await Promise.all(
        Array.from(this.adapters.values()).map((adapter) =>
          adapter.disconnect(disconnectParams),
        ),
      )
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to disconnect: ${errorMessage}`,
        ErrorCode.PROVIDER_DISCONNECTION_FAILED,
        { provider: provider as string, userId },
      )
    }
  }

  /**
   * Gets accounts for a user.
   *
   * @param userId - The user ID to get accounts for
   * @param provider - Optional provider to get accounts from
   * @param additionalParams - Additional parameters for the request
   * @returns A promise that resolves to an array of accounts
   * @throws {PulseError} If fetching accounts fails
   *
   * @example
   * ```typescript
   * const accounts = await pulse.getAccounts('user-123', 'plaid')
   * ```
   */
  async getAccounts(
    userId: string,
    provider?: P,
    additionalParams: Record<string, unknown> = {},
  ): Promise<Account[]> {
    try {
      const accountParams: GetAccountsParams = {
        userId,
        ...additionalParams,
      }

      if (provider) {
        return await this.getAdapter({ provider }).getAccounts(accountParams)
      }

      const accountPromises = Array.from(this.adapters.values()).map(
        (adapter) =>
          adapter.getAccounts(accountParams).catch((error) => {
            console.error(
              `Error fetching accounts from ${adapter.provider}:`,
              error,
            )
            return [] as Account[]
          }),
      )

      const accounts = await Promise.all(accountPromises)
      return accounts.flat()
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to fetch accounts: ${errorMessage}`,
        ErrorCode.ACCOUNT_FETCH_FAILED,
        { provider: provider as string, userId },
      )
    }
  }

  /**
   * Gets transactions for an account.
   *
   * @param accountId - The account ID to get transactions for
   * @param provider - Optional provider to get transactions from
   * @param options - Optional transaction history options
   * @returns A promise that resolves to an array of transactions
   * @throws {PulseError} If fetching transactions fails
   *
   * @example
   * ```typescript
   * // Get transactions for an account
   * const transactions = await pulse.getTransactions('account-123', 'plaid')
   *
   * // Get transactions with options
   * const recentTransactions = await pulse.getTransactions('account-123', 'plaid', {
   *   limit: 10,
   *   startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
   * })
   * ```
   */
  async getTransactions(
    accountId: string,
    provider?: P,
    options?: TransactionHistoryOptions,
  ): Promise<Transaction[]> {
    try {
      const transactionParams: GetTransactionsParams = {
        accountId,
        options,
      }

      if (provider) {
        return await this.getAdapter({ provider }).getTransactions(
          transactionParams,
        )
      }

      // Try each adapter until one succeeds
      const errors: Error[] = []
      for (const adapter of this.adapters.values()) {
        try {
          return await adapter.getTransactions(transactionParams)
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)))
        }
      }

      // If we get here, all adapters failed
      throw new PulseError(
        `All providers failed to fetch transactions: ${errors.map((e) => e.message).join('; ')}`,
        ErrorCode.TRANSACTION_FETCH_FAILED,
        { accountId },
      )
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to fetch transactions: ${errorMessage}`,
        ErrorCode.TRANSACTION_FETCH_FAILED,
        { provider: provider as string, accountId },
      )
    }
  }

  /**
   * Refreshes accounts for a user.
   *
   * @param userId - The user ID to refresh accounts for
   * @param provider - Optional provider to refresh accounts from
   * @param additionalParams - Additional parameters for the refresh
   * @returns A promise that resolves when the refresh is complete
   * @throws {PulseError} If refreshing accounts fails
   *
   * @example
   * ```typescript
   * await pulse.refreshAccounts('user-123', 'plaid')
   * ```
   */
  async refreshAccounts(
    userId: string,
    provider?: P,
    additionalParams: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      const refreshParams: RefreshAccountsParams = {
        userId,
        ...additionalParams,
      }

      if (provider) {
        await this.getAdapter({ provider }).refreshAccounts(refreshParams)
        return
      }

      await Promise.all(
        Array.from(this.adapters.values()).map((adapter) =>
          adapter.refreshAccounts(refreshParams).catch((error) => {
            console.error(
              `Error refreshing accounts from ${adapter.provider}:`,
              error,
            )
          }),
        ),
      )
    } catch (error) {
      if (error instanceof PulseError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new PulseError(
        `Failed to refresh accounts: ${errorMessage}`,
        ErrorCode.ACCOUNT_REFRESH_FAILED,
        { provider: provider as string, userId },
      )
    }
  }
}

export * from './interfaces'
export * from './types'
