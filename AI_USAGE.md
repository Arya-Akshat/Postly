# AI Usage Report — Postly Project

## 🤖 Tool Used
- **Antigravity (Google DeepMind)**: Used as a pair-programming AI assistant for architectural design, code generation, and debugging.

## 📝 Key Prompts & Tasks
1. **Infrastructure Setup**: "Configure BullMQ with Redis and Postgres for a multi-platform publishing system."
2. **AI Prompt Engineering**: "Refine the system prompt to handle specific constraints for Twitter (280 chars), LinkedIn (1000 chars), and Instagram (hashtags)."
3. **Security Refactoring**: "Encrypt social account tokens using AES-256-GCM and implement JWT rotation."
4. **Bug Fixing**: "Fix the BullMQ queue naming convention and optimize Jest test setup for faster DB resets."
5. **UI Development**: "Build a Streamlit dashboard to monitor the status of the PostgreSQL tables and Redis queues."

## 🛠️ Changes & Logic Contributions
- **Queue Architecture**: Designed the one-queue-per-platform strategy to handle rate limits independently.
- **Dynamic Prompting**: Implemented a length-selection logic (Minimal/Medium/High) that dynamically adjusts AI instructions.
- **Safety Audits**: Performed history purging to remove accidentally committed secrets.
- **Endpoint Implementation**: Built out the `POST /api/content/generate` and `/api/admin/clear-all` endpoints to meet the assignment brief.

## 🧠 Understanding
All code generated or refactored by the AI was reviewed for:
- **Error Handling**: Proper try/catch blocks and Prisma transaction safety.
- **Security**: Ensuring secrets are never logged or stored in plaintext.
- **Scalability**: Using background workers for heavy I/O tasks.
