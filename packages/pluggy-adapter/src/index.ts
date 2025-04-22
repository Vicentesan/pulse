import {
  type Account,
  AccountType,
  BasePulseAdapter,
  type PulseAdapterConfig,
  type Transaction,
  TransactionType,
} from '@pulse/sdk'
import { PluggyClient } from 'pluggy-sdk'

export class PluggyAdapter extends BasePulseAdapter<'pluggy'> {
  readonly provider = 'pluggy' as const
  private client: PluggyClient
  private accessToken?: string

  constructor(config: PulseAdapterConfig) {
    super(config)

    if (!config.apiKey || !config.clientId)
      throw new Error('Pluggy API key and client ID are required')

    this.client = new PluggyClient({
      clientId: config.clientId,
      clientSecret: config.apiKey,
    })
  }

  async connect({ userId }: { userId: string }): Promise<void> {
    try {
      // Create a link token for the user
      const response = await this.client.createConnectToken(userId, {
        clientUserId: userId,
      })

      if (!response.accessToken)
        throw new Error('Failed to create access token')

      // Store the link token for later use
      this.accessToken = response.accessToken
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Pluggy: ${error.message}`)
      }
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.accessToken) throw new Error('Not connected to Pluggy')

      this.accessToken = undefined
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to disconnect from Pluggy: ${error.message}`)
      }
      throw error
    }
  }

  async getAccounts(): Promise<Account[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Not connected to Pluggy')
      }

      const response = await this.client.fetchAccounts(this.accessToken)

      const accounts = response.results

      return accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: this.mapAccountType(account.type),
        balance: account.balance,
        currency: account.currencyCode,
        lastUpdated: new Date().toISOString(),
      }))
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch accounts: ${error.message}`)
      }
      throw error
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      if (!this.accessToken) throw new Error('Not connected to Pluggy')

      const response = await this.client.fetchTransactions(this.accessToken)

      const transactions = response.results
      // Filter out pending transactions
      const filteredTransactions = transactions.filter(
        (transaction) => !transaction.status?.includes('PENDING'),
      )

      return filteredTransactions.map((transaction) => ({
        id: transaction.id,
        accountId: transaction.accountId,
        amount: Math.abs(transaction.amount),
        currency: transaction.currencyCode?.toUpperCase() || 'USD',
        description: transaction.description,
        category: transaction.category?.[0],
        type:
          transaction.amount < 0
            ? TransactionType.DEBIT
            : TransactionType.CREDIT,
        date: transaction.date.toISOString(),
      }))
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }
      throw error
    }
  }

  private mapAccountType(pluggyType: string): AccountType {
    const typeMap: Record<string, AccountType> = {
      BANK: AccountType.CHECKING,
      CREDIT: AccountType.CREDIT,
    }

    return typeMap[pluggyType.toLowerCase()] || AccountType.OTHER
  }
}
