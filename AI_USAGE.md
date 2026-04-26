# AI Usage

- Uses real API endpoints for both OpenAI and Anthropic Claude.
- Fallback resolution order: user's `ai_keys` in DB -> system fallback keys in `.env`.
- Platform-specific system prompts dynamically adapt content to Twitter, LinkedIn, Instagram, and Threads length and style guidelines.
- Features automatic retry with 1s delay on API failures (max 3 attempts).
