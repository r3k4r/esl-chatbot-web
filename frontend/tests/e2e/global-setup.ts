import { startMockApi } from './mock-api/server'

// The mock API lives inside the Playwright process: it starts here and is closed
// by the returned teardown, so no extra process is left running after a test run.
export default async function globalSetup() {
  const server = await startMockApi()
  return async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}
