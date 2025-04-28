import { PlaidAdapter } from '@pulse/plaid-adapter'
import { Pulse } from '@pulse/sdk'

export const pulse = new Pulse({
  adapters: [
    new PlaidAdapter({
      clientId: '',
    }),
  ],
})

const accs = await pulse.getAccounts('', 'plaid')
