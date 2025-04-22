import { type Provider, PulseAdapter, PulseOptions } from './interfaces'
import { Account, Transaction } from './types'

export class Pulse<P extends Provider> {
  private adapters: Map<P, PulseAdapter<P>>

  constructor(options: PulseOptions<P>) {
    if (!options.adapters || options.adapters.length === 0) {
      throw new Error('At least one adapter must be provided')
    }

    this.adapters = new Map()
    options.adapters.forEach((adapter) => {
      this.adapters.set(adapter.provider, adapter)
    })
  }

  private getAdapter(params: { provider?: P }): PulseAdapter<P> {
    if (params.provider) {
      const adapter = this.adapters.get(params.provider)
      if (!adapter) throw new Error(`Provider ${params.provider} not found`)
      return adapter
    }
    return Array.from(this.adapters.values())[0]
  }

  async connect(userId: string, provider?: P): Promise<void> {
    if (provider) {
      await this.getAdapter({ provider }).connect({ userId })
      return
    }

    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.connect({ userId }),
      ),
    )
  }

  async disconnect(params: { provider?: P } = {}): Promise<void> {
    if (params.provider) {
      await this.getAdapter({ provider: params.provider }).disconnect({})
      return
    }

    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.disconnect({}),
      ),
    )
  }

  async getAccounts(params: { provider?: P } = {}): Promise<Account[]> {
    if (params.provider)
      return this.getAdapter({ provider: params.provider }).getAccounts({})

    const accountPromises = Array.from(this.adapters.values()).map((adapter) =>
      adapter.getAccounts({}),
    )

    const accounts = await Promise.all(accountPromises)
    return accounts.flat()
  }

  async getTransactions(params: {
    accountId: string
    provider?: P
  }): Promise<Transaction[]> {
    if (params.provider)
      return this.getAdapter({ provider: params.provider }).getTransactions({
        accountId: params.accountId,
      })

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
    provider?: P
  }): Promise<void> {
    if (params.provider) {
      await this.getAdapter({ provider: params.provider }).refreshAccounts({
        userId: params.userId,
      })
      return
    }

    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.refreshAccounts({ userId: params.userId }),
      ),
    )
  }
}

export * from './interfaces'
export * from './types'
