# Architecture

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis for background publishing tasks
- **AI Integrations**: OpenAI and Anthropic Claude
- **Telegram Bot**: Grammy framework with webhooks
- **Authentication**: JWT with short-lived access tokens and long-lived refresh tokens (stored in DB)
- **Encryption**: AES-256-GCM for sensitive social and AI API keys
