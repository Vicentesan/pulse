# pulse
a unified typescript sdk for financial data providers.


## overview
pulse simplifies integration with multiple financial data providers by offering a single, consistent interface. instead of managing separate setups and learning different apis for pluggy, teller, and other providers, pulse lets you configure once and access all supported services through a unified api.

## why pulse?
- single integration: connect to multiple financial data providers through one sdk
- consistent api: uniform methods and data structures across all providers
- simplified development: reduce boilerplate and provider-specific code
- fullstack solution: designed to work seamlessly in both frontend and backend environments
- adaptable: modular adapter system for easy extension to new providers

## installation
`npm install @yourusername/pulse`
# or
`yarn add @yourusername/pulse`
# or
`bun add @yourusername/pulse`

## peer dependencies
pulse uses an adapter system that requires the underlying provider sdks as peer dependencies. install only the ones you plan to use:

`npm install pluggy-sdk teller-sdk` ... etc

## basic usage
```typescript
import { Pulse } from '@yourusername/pulse'
import { PluggyAdapter } from '@yourusername/pulse-pluggy'
import { TellerAdapter } from '@yourusername/pulse-teller'

// initialize pulse with your providers
const pulse = new Pulse({
  adapters: [
    new PluggyAdapter({
      clientId: 'your-pluggy-client-id',
      clientSecret: 'your-pluggy-client-secret'
    }),
    new TellerAdapter({
      apiKey: 'your-teller-api-key'
    })
  ]
})

// use a unified api for all providers
const accounts = await pulse.getAccounts({
  userId: 'user-123'
})

// or specify a provider if needed
const pluggyAccounts = await pulse.getAccounts({
  userId: 'user-123',
  provider: 'pluggy'
})
```

## supported providers
pulse is in early development. planned support includes:
- pluggy
- teller
- ...

## development status
⚠️ early development - this library is currently in the initial development phase and not ready for production use.

## contributing
contributions are welcome! please feel free to submit a pull request.

## license
mit