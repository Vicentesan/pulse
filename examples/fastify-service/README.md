# Pulse SDK Example Service

This example demonstrates how to integrate the Pulse SDK into a Fastify-based backend service.

## Features

- RESTful API for accessing financial data
- Mock adapter implementation for testing
- Swagger documentation
- TypeScript support
- Environment variable configuration

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
bun install
```

2. Create a `.env` file:
```env
PORT=3000
HOST=0.0.0.0
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

## API Endpoints

- `POST /connect/:userId` - Connect a user to the financial service
- `POST /disconnect/:userId` - Disconnect a user from the financial service
- `GET /accounts/:userId` - Get user's accounts
- `GET /transactions/:userId/:accountId` - Get account transactions

## Documentation

API documentation is available at `/docs` when the server is running.

## Mock Data

This example uses a mock adapter that provides sample data. In a real application, you would replace this with actual provider adapters (Pluggy, Teller, etc.). 