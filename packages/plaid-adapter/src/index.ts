import {
  type Account,
  AccountType,
  BasePulseAdapter,
  type PulseAdapterConfig,
  type Transaction,
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

export class PlaidAdapter extends BasePulseAdapter<'plaid'> {
  readonly provider = 'plaid' as const
  private client: PlaidApi
  private accessToken?: string

  constructor(config: PulseAdapterConfig) {
    super(config)

    if (!config.apiKey) {
      throw new Error('Plaid API key is required')
    }

    const configuration = new Configuration({
      basePath:
        PlaidEnvironments[
          config.environment === 'production' ? 'production' : 'sandbox'
        ],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': config.clientId,
          'PLAID-SECRET': config.apiKey,
        },
      },
    })

    this.client = new PlaidApi(configuration)
  }

  async connect({ userId }: { userId: string }): Promise<void> {
    try {
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
        throw new Error('Failed to create link token')
      }

      // Store the link token for later use
      this.accessToken = data.link_token
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Plaid: ${error.message}`)
      }
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.accessToken) throw new Error('Not connected to Plaid')

      // Remove the item (disconnect the account)
      await this.client.itemRemove({
        access_token: this.accessToken,
      })

      this.accessToken = undefined
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to disconnect from Plaid: ${error.message}`)
      }
      throw error
    }
  }

  async getAccounts(): Promise<Account[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Not connected to Plaid')
      }

      const response = await this.client.accountsGet({
        access_token: this.accessToken,
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
      }))
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch accounts: ${error.message}`)
      }
      throw error
    }
  }

  async getTransactions({
    accountId,
  }: {
    accountId: string
  }): Promise<Transaction[]> {
    try {
      if (!this.accessToken) throw new Error('Not connected to Plaid')

      const response = await this.client.transactionsGet({
        access_token: this.accessToken,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // Last 30 days
        end_date: new Date().toISOString().split('T')[0],
        options: {
          account_ids: [accountId],
          count: 100,
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
      }))
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }
      throw error
    }
  }

  // Helper method to map Plaid account types to Pulse account types
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
