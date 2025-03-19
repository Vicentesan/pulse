import { PulseAdapter } from './interfaces'

interface PulseOptions {
  adapters: PulseAdapter[]
}

interface ConnectParams {
  userId: string
  provider?: string
}

interface DisconnectParams {
  userId: string
  provider?: string
}

interface GetAccountsParams {
  userId: string
  provider?: string
}

interface GetTransactionsParams {
  userId: string
  accountId: string
  provider?: string
}

export class Pulse {
  private adapters: Map<string, PulseAdapter>

  constructor(options: PulseOptions) {
    this.adapters = new Map(
      options.adapters.map((adapter) => [adapter.provider, adapter]),
    )
  }

  async connect(params: ConnectParams | string): Promise<void> {
    const { userId, provider } = this.#normalizeParams(params)
    const adapter = this.#getAdapter(provider)
    await adapter.connect({ userId })
  }

  async disconnect(params: DisconnectParams | string): Promise<void> {
    const { userId, provider } = this.#normalizeParams(params)
    const adapter = this.#getAdapter(provider)
    await adapter.disconnect({ userId })
  }

  async getAccounts(params: GetAccountsParams | string) {
    const { userId, provider } = this.#normalizeParams(params)
    const adapter = this.#getAdapter(provider)
    return adapter.getAccounts({ userId })
  }

  async getTransactions(
    paramsOrUserId: GetTransactionsParams | string,
    accountId?: string,
  ) {
    if (typeof paramsOrUserId === 'string') {
      if (!accountId) {
        throw new Error('accountId is required when using string parameters')
      }
      const adapter = this.#getAdapter()
      return adapter.getTransactions({ userId: paramsOrUserId, accountId })
    }

    const { userId, provider } = this.#normalizeParams(paramsOrUserId)
    const adapter = this.#getAdapter(provider)
    return adapter.getTransactions({
      userId,
      accountId: paramsOrUserId.accountId,
    })
  }

  #normalizeParams(params: { userId: string; provider?: string } | string) {
    if (typeof params === 'string') {
      return { userId: params, provider: undefined }
    }
    return params
  }

  #getAdapter(provider?: string): PulseAdapter {
    if (provider) {
      const adapter = this.adapters.get(provider)
      if (!adapter) {
        throw new Error(`Provider ${provider} not found`)
      }
      return adapter
    }

    // If no provider specified and only one adapter, use it
    if (this.adapters.size === 1) {
      return Array.from(this.adapters.values())[0]
    }

    throw new Error(
      'Provider must be specified when multiple adapters are available',
    )
  }
}
