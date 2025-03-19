import { Account, Transaction } from './types'
import { PulseConfig, PulseOptions } from './interfaces'

export class Pulse {
  private config: PulseConfig

  constructor(options: PulseOptions) {
    this.config = options.config
  }

  async getAccounts(userId: string): Promise<Account[]> {
    return []
  }

  async getTransactions(params: { 
    userId: string; 
    accountId: string;
  }): Promise<Transaction[]> {
    return []
  }
}

export * from './types'
export * from './interfaces' 