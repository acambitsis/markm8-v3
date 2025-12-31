// Convex Auth Configuration for Clerk Integration
// The domain will be configured via environment variables in the Convex dashboard

export default {
  providers: [
    {
      // This will be set from the Clerk dashboard JWT template
      // The domain should be your Clerk frontend API URL
      // e.g., "https://your-app.clerk.accounts.dev"
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};
