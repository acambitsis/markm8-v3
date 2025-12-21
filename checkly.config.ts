import { defineConfig } from 'checkly';
import { EmailAlertChannel, Frequency } from 'checkly/constructs';

const sendDefaults = {
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: true,
};

// TODO: Add your production URL when deployed
const productionURL = 'https://markm8.app';

const emailChannel = new EmailAlertChannel('email-channel-1', {
  // TODO: Add your own email address for monitoring alerts
  address: 'alerts@markm8.app',
  ...sendDefaults,
});

export const config = defineConfig({
  projectName: 'MarkM8',
  logicalId: 'markm8-v3',
  repoUrl: 'https://github.com/yourusername/markm8-v3',
  checks: {
    locations: ['us-east-1', 'eu-central-1'],
    tags: ['website'],
    runtimeId: '2024.02',
    browserChecks: {
      frequency: Frequency.EVERY_24H,
      testMatch: '**/tests/e2e/**/*.check.e2e.ts',
      alertChannels: [emailChannel],
    },
    playwrightConfig: {
      use: {
        baseURL: process.env.ENVIRONMENT_URL || productionURL,
        extraHTTPHeaders: {
          'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_TOKEN,
        },
      },
    },
  },
  cli: {
    runLocation: 'us-east-1',
    reporters: ['list'],
  },
});

export default config;
