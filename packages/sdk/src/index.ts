import { PulseAdapter, PulseOptions } from './interfaces'
import { Account, Transaction } from './types'

export class Pulse {
  private adapters: Map<string, PulseAdapter>

  constructor(options: PulseOptions) {
    if (!options.adapters || options.adapters.length === 0) {
      throw new Error('At least one adapter must be provided')
    }

    this.adapters = new Map()
    options.adapters.forEach((adapter) => {
      this.adapters.set(adapter.provider, adapter)
    })
  }

  private getAdapter({ provider }: { provider?: 'teller' }): PulseAdapter {
    if (provider) {
      const adapter = this.adapters.get(provider)
      if (!adapter) throw new Error(`Provider ${provider} not found`)

      return adapter
    }
    return Array.from(this.adapters.values())[0]
  }

  async connect(userId: string, provider?: 'teller'): Promise<void> {
    if (provider) {
      await this.getAdapter({ provider }).connect({ userId })
      return
    }

    // Connect all adapters
    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.connect({ userId }),
      ),
    )
  }

  async disconnect({ provider }: { provider?: 'teller' }): Promise<void> {
    if (provider) {
      await this.getAdapter({ provider }).disconnect({ provider })
      return
    }

    // Disconnect all adapters
    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.disconnect({
          provider,
        }),
      ),
    )
  }

  async getAccounts(params: { provider?: 'teller' }): Promise<Account[]> {
    if (params.provider)
      return this.getAdapter({ provider: params.provider }).getAccounts({
        provider: params.provider,
      })

    // Get accounts from all adapters
    const accountPromises = Array.from(this.adapters.values()).map((adapter) =>
      adapter.getAccounts({
        provider: params.provider,
      }),
    )

    const accounts = await Promise.all(accountPromises)

    return accounts.flat()
  }

  async getTransactions(params: {
    accountId: string
    provider?: 'teller'
  }): Promise<Transaction[]> {
    if (params.provider)
      return this.getAdapter({ provider: params.provider }).getTransactions({
        accountId: params.accountId,
      })

    // Get transactions from all adapters
    const transactionPromises = Array.from(this.adapters.values()).map(
      (adapter) =>
        adapter.getTransactions({
          accountId: params.accountId,
        }),
    )

    const transactions = await Promise.all(transactionPromises)

    return transactions.flat()
  }

  async refreshAccounts(params: {
    userId: string
    provider?: 'teller'
  }): Promise<void> {
    if (params.provider) {
      await this.getAdapter({ provider: params.provider }).refreshAccounts({
        userId: params.userId,
      })
      return
    }

    // Refresh all adapters
    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.refreshAccounts({ userId: params.userId }),
      ),
    )
  }
}

export * from './interfaces'
export * from './types'
