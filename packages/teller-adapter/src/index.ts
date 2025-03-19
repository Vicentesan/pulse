/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type Account,
  AccountType,
  BasePulseAdapter,
  type PulseAdapterConfig,
  type Transaction,
  TransactionType,
} from '@pulse/sdk'

import {
  TellerAccountSchema,
  TellerConnectResponseSchema,
  TellerTransactionSchema,
} from './schemas'

export class TellerAdapter extends BasePulseAdapter {
  readonly provider = 'teller'
  #apiUrl = 'https://api.teller.io'
  #accessToken?: string

  constructor(config: PulseAdapterConfig) {
    super(config)
    if (!config.apiKey) {
      throw new Error('Teller API key is required')
    }
  }

  async connect(userId: string): Promise<void> {
    try {
      // Create a Teller Connect token for the user
      const response = await fetch(`${this.#apiUrl}/connect/token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          products: ['transactions', 'balance', 'identity'],
        }),
      })

      if (!response.ok)
        throw new Error(`Teller API error: ${response.statusText}`)

      const data = await response.json()
      const parsedData = TellerConnectResponseSchema.parse(data)
      this.#accessToken = parsedData.access_token
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Teller: ${error.message}`)
      }
      throw error
    }
  }

  async disconnect(userId: string): Promise<void> {
    try {
      if (!this.#accessToken) throw new Error('Not connected to Teller')

      // Revoke the access token
      const response = await fetch(`${this.#apiUrl}/connect/token/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.#accessToken,
        }),
      })

      if (!response.ok)
        throw new Error(`Failed to revoke Teller token: ${response.statusText}`)

      this.#accessToken = undefined
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to disconnect from Teller: ${error.message}`)
      }
      throw error
    }
  }

  async getAccounts(_userId: string): Promise<Account[]> {
    try {
      if (!this.#accessToken) throw new Error('Not connected to Teller')

      const response = await fetch(`${this.#apiUrl}/accounts`, {
        headers: {
          Authorization: `Basic ${btoa(`${this.#accessToken}:`)}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok)
        throw new Error(`Teller API error: ${response.statusText}`)

      const data = await response.json()
      const accounts = TellerAccountSchema.array().parse(data)

      return accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: this.#mapAccountType(account.type),
        balance: parseFloat(account.balances.current),
        currency: account.currency.toUpperCase(),
        lastUpdated: account.last_updated,
      }))
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch accounts: ${error.message}`)
      }
      throw error
    }
  }

  async getTransactions(
    userId: string,
    accountId: string,
  ): Promise<Transaction[]> {
    try {
      if (!this.#accessToken) {
        throw new Error('Not connected to Teller')
      }

      const response = await fetch(
        `${this.#apiUrl}/accounts/${accountId}/transactions`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${this.#accessToken}:`)}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Teller API error: ${response.statusText}`)
      }

      const data = await response.json()
      const transactions = TellerTransactionSchema.array().parse(data)

      // Filter out pending transactions as noted in the reference implementation
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
      }))
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }
      throw error
    }
  }

  // Helper method to map Teller account types to Pulse account types
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
