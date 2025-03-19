import {
  Account,
  AccountType,
  BasePulseAdapter,
  Transaction,
  TransactionType,
} from '@pulse/sdk'

export class MockAdapter extends BasePulseAdapter {
  readonly provider = 'mock'
  private connectedUsers = new Set<string>()

  async connect(userId: string): Promise<void> {
    this.connectedUsers.add(userId)
  }

  async disconnect(userId: string): Promise<void> {
    this.connectedUsers.delete(userId)
  }

  async getAccounts(userId: string): Promise<Account[]> {
    if (!this.connectedUsers.has(userId)) {
      throw new Error('User not connected')
    }

    return [
      {
        id: 'mock-checking-1',
        name: 'Mock Checking Account',
        type: AccountType.CHECKING,
        balance: 1500.5,
        currency: 'USD',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'mock-savings-1',
        name: 'Mock Savings Account',
        type: AccountType.SAVINGS,
        balance: 5000.75,
        currency: 'USD',
        lastUpdated: new Date().toISOString(),
      },
    ]
  }

  async getTransactions(
    userId: string,
    accountId: string,
  ): Promise<Transaction[]> {
    if (!this.connectedUsers.has(userId)) {
      throw new Error('User not connected')
    }

    return [
      {
        id: 'mock-tx-1',
        accountId,
        amount: 50.0,
        currency: 'USD',
        description: 'Coffee Shop',
        category: 'Food & Drink',
        type: TransactionType.DEBIT,
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
      {
        id: 'mock-tx-2',
        accountId,
        amount: 2500.0,
        currency: 'USD',
        description: 'Salary Deposit',
        category: 'Income',
        type: TransactionType.CREDIT,
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
    ]
  }
}
