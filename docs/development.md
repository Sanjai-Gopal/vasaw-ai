# VASAW AI — Developer Guide

## Test Suite Execution

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript typecheck
npx tsc --noEmit

# Run Next.js production build
npm run build
```

## Adding New Integrations

1. Define provider interface in `lib/integrations/<name>/provider.ts`.
2. Implement mock provider in `lib/integrations/<name>/mock-provider.ts`.
3. Implement live API provider in `lib/integrations/<name>/api-provider.ts`.
4. Export factory function in `lib/integrations/<name>/index.ts`.
5. Add unit tests in `tests/<name>.test.ts`.
