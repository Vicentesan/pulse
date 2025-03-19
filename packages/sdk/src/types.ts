export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  lastUpdated: string
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT = 'CREDIT',
  INVESTMENT = 'INVESTMENT',
  LOAN = 'LOAN',
  OTHER = 'OTHER'
}

export interface Transaction {
  id: string
  accountId: string
  amount: number
  currency: string
  description: string
  category?: string
  type: TransactionType
  date: string
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
} 