# pulse
A unified typescript sdk for financial data providers.

## Overview
Pulse simplifies integration with multiple financial data providers by offering a single, consistent interface. Instead of managing separate setups and learning different APIs for various providers, Pulse lets you configure once and access all supported services through a unified API.

## Why Pulse?
- Single Integration: Connect to multiple financial data providers through one SDK
- Consistent API: Uniform methods and data structures across all providers
- Simplified Development: Reduce boilerplate and provider-specific code
- Fullstack Solution: Designed to work seamlessly in both frontend and backend environments
- Adaptable: Modular adapter system for easy extension to new providers

## Installation
```bash
npm install @pulse/sdk
# or
yarn add @pulse/sdk
# or
bun add @pulse/sdk
```

## Basic Usage
```typescript
import { Pulse } from '@pulse/sdk'
import { MyCustomAdapter } from './my-adapter'

// Initialize Pulse with your adapters
const pulse = new Pulse({
  adapters: [
    new MyCustomAdapter({
      apiKey: 'your-api-key'
    })
  ]
})

// Connect to the provider
await pulse.connect('user-123')

// Get user accounts
const accounts = await pulse.getAccounts({
  userId: 'user-123'
})

// Get account transactions
const transactions = await pulse.getTransactions({
  userId: 'user-123',
  accountId: 'account-456'
})

// Refresh user accounts
await pulse.refreshAccounts({
  userId: 'user-123'
})

// Disconnect when done
await pulse.disconnect('user-123')
```

## Creating Custom Adapters
You can create custom adapters by extending the `BasePulseAdapter` class:

```typescript
import { BasePulseAdapter, PulseAdapterConfig, Account, Transaction } from '@pulse/sdk'

export class MyCustomAdapter extends BasePulseAdapter {
  readonly provider = 'my-provider'

  async connect(userId: string): Promise<void> {
    // Implement connection logic
  }

  async disconnect(userId: string): Promise<void> {
    // Implement disconnection logic
  }

  async getAccounts(userId: string): Promise<Account[]> {
    // Implement account fetching logic
    return []
  }

  async getTransactions(userId: string, accountId: string): Promise<Transaction[]> {
    // Implement transaction fetching logic
    return []
  }
}
```

## Development Status
⚠️ Early Development - This library is currently in the initial development phase and not ready for production use.

## Contributing
Contributions are welcome! Please feel free to submit a pull request.

## License
MIT