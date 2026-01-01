# ixartz SaaS Boilerplate Reference

This document contains reference information for the [ixartz SaaS Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) that MarkM8 is built on.

---

## Boilerplate Features

Developer experience first, extremely flexible code structure:

- ⚡ [Next.js](https://nextjs.org) with App Router support
- 🔥 Type checking [TypeScript](https://www.typescriptlang.org)
- 💎 Integrate with [Tailwind CSS](https://tailwindcss.com) and Shadcn UI
- ✅ Strict Mode for TypeScript and [React](https://react.dev)
- 🔒 Authentication with [Clerk](https://go.clerk.com/zGlzydF)
- 👤 Passwordless Authentication with Magic Links, Multi-Factor Auth (MFA), Social Auth
- 📦 Type-safe database with Convex
- 💽 Local development with Convex dev server
- 🌐 Multi-language (i18n) with [next-intl](https://next-intl-docs.vercel.app/)
- ♻️ Type-safe environment variables with T3 Env
- ⌨️ Form with [React Hook Form](https://react-hook-form.com)
- 🔴 Validation library with [Zod](https://zod.dev)
- 📏 Linter with [ESLint](https://eslint.org)
- 💖 Code Formatter with [Prettier](https://prettier.io)
- 🦊 Husky for Git Hooks
- 🚫 Lint-staged for running linters on Git staged files
- 🚓 Lint git commit with Commitlint
- 📓 Write standard compliant commit messages with Commitizen
- 🦺 Unit Testing with [Vitest](https://vitest.dev) and React Testing Library
- 🧪 Integration and E2E Testing with [Playwright](https://playwright.dev)
- 👷 Run tests on pull requests with GitHub Actions
- 🚨 Error Monitoring with [Sentry](https://sentry.io/for/nextjs/)
- 📝 Logging with [Pino.js](https://getpino.io)
- 💡 Absolute Imports using `@` prefix
- 🗂 VSCode configuration: Debug, Settings, Tasks and Extensions
- 🤖 SEO metadata, JSON-LD and Open Graph tags
- 🗺️ Sitemap.xml and robots.txt
- ⌘ Database exploration with Convex Dashboard

---

## Project Structure

```shell
.
├── README.md                       # README file
├── .github                         # GitHub folder
├── .husky                          # Husky configuration
├── .vscode                         # VSCode configuration
├── convex                          # Convex backend (schema, functions, http endpoints)
├── public                          # Public assets folder
├── scripts                         # Scripts folder
├── src
│   ├── app                         # Next JS App (App Router)
│   ├── components                  # Reusable components
│   ├── features                    # Components specific to a feature
│   ├── hooks                       # Custom React hooks
│   ├── libs                        # 3rd party libraries configuration
│   ├── locales                     # Locales folder (i18n messages)
│   ├── styles                      # Styles folder (Tailwind 4 CSS-first config)
│   ├── templates                   # Templates folder
│   ├── types                       # Type definitions
│   └── utils                       # Utilities folder
├── tests
│   ├── e2e                         # E2E tests
│   └── integration                 # Integration tests
└── tsconfig.json                   # TypeScript configuration
```

---

## Setup Instructions

### Authentication

Create a Clerk account at [Clerk.com](https://go.clerk.com/zGlzydF) and create a new application. Copy the values into `.env.local`:

```shell
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Database

The project uses Convex for the database and serverless functions. Set up your Convex project and add the deployment URL to `.env.local`:

```shell
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

See `SETUP.md` for detailed Convex setup instructions.

### Translation (i18n)

For translation, the project uses `next-intl`. Translations are managed in `src/locales/` as JSON files.

---

## Database Operations

### Change Schema

Update `./convex/schema.ts`, then run Convex dev to apply changes:

```shell
bun run convex:dev
```

Schema changes are automatically synced to your Convex deployment.

### Database Dashboard

Explore the database with Convex Dashboard:

```shell
# Dashboard opens automatically when running convex:dev
# Or visit: https://dashboard.convex.dev
```

---

## Commit Message Format

The project follows [Conventional Commits](https://www.conventionalcommits.org/). Use Commitizen for guided commits:

```shell
npm run commit
```

---

## Testing

### Unit Tests

```shell
bun run test
```

### Integration & E2E Testing

```shell
npx playwright install # Only first time
bun run test:e2e
```

---

## Deployment

### Production Build

During the build process, Convex functions are automatically deployed. Define `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY` in your environment variables.

```shell
bun run build
bun run start
```

You also need to define `CLERK_SECRET_KEY` using your own key.

---

## Error Monitoring

The project uses [Sentry](https://sentry.io/for/nextjs/) for error monitoring. In development, Spotlight (Sentry for Development) is pre-configured.

For production, create a Sentry account and update `org` and `project` in `next.config.mjs`. Add your Sentry DSN to the config files.

---

## Logging

The project uses Pino.js for logging. In development, logs display in the console.

For production, integrate with [Better Stack](https://betterstack.com/) by adding `LOGTAIL_SOURCE_TOKEN` to your environment variables.

---

## Useful Commands

### Bundle Analyzer

```shell
npm run build-stats
```

### Database Studio

```shell
bun run db:studio
```

---

## VSCode Integration

Install the suggested extensions in `.vscode/extension.json` for:
- ESLint auto-fix
- Prettier formatting
- Vitest test runner
- TypeScript type checking

Pro tip: Project-wide type checking with <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> on Mac.

---

## Customization

Quick customization by searching for `FIXME:` in the codebase. Key files:

- `public/apple-touch-icon.png`, `public/favicon.ico`: Website favicon
- `src/utils/AppConfig.ts`: Configuration file
- `src/templates/BaseTemplate.tsx`: Default theme
- `next.config.mjs`: Next.js configuration
- `.env`: Default environment variables

---

## License

The ixartz SaaS Boilerplate is licensed under the MIT License.

Made with ♥ by [CreativeDesignsGuru](https://creativedesignsguru.com)

