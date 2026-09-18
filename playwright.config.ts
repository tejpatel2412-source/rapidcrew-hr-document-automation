import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    env: { ...process.env, RAPIDCREW_ACCESS_PASSWORD: process.env.RAPIDCREW_ACCESS_PASSWORD || 'Buzzinga@0' }
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
