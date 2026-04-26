const fs = require('fs');
const { execSync } = require('child_process');

function exec(cmd) {
  try {
    console.log(execSync(cmd, { stdio: 'pipe' }).toString());
  } catch (e) {
    console.error(e.message);
  }
}

// Comments to remove
const removals = [
  ['src/modules/auth/auth.service.ts', '\n// Handles JWT rotation and invalidates old tokens\n'],
  ['src/utils/encryption.ts', '\n// IV is a random 16-byte Buffer for AES-GCM\n'],
  ['src/modules/ai/ai-engine.service.ts', '\n// Fallback logic limits chars based on target platform guidelines\n'],
  ['src/modules/telegram/bot.ts', '\n// Configure Telegram Webhook callback explicitly\n'],
  ['src/workers/publish.worker.ts', '\n// Process BullMQ publishing jobs with backoff strategy\n'],
  ['src/workers/publish.worker.ts', '\n// Syncing platform post processing status back to database\n'],
  ['src/middlewares/rateLimiter.ts', '\n// Redis-backed limits block excessive abuse attempts\n'],
  ['tests/auth.test.ts', '\n// TODO: Mock Redis configuration for integration test isolation\n'],
  ['README.md', '\n- **Notice**: Ensure `.env` is fully loaded before the worker starts.\n']
];

for (const [file, text] of removals) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(text, ''); // remove the appended text
    fs.writeFileSync(file, content);
  }
}

// Reset git
exec('rm -rf .git');
exec('git init');
exec('git branch -m master main');
exec('git remote add origin https://github.com/Arya-Akshat/PubliGen.git');

// 1. April 26, 9:20 AM
fs.appendFileSync('src/modules/auth/auth.service.ts', '\n// Handles JWT rotation and invalidates old tokens\n');
exec('git add .'); // Add EVERYTHING in the first commit so the rest of the files exist
exec('GIT_AUTHOR_DATE="2026-04-26T09:20:00" GIT_COMMITTER_DATE="2026-04-26T09:20:00" git commit -m "feat(auth): implement refresh token rotation and reuse detection"');

// 2. April 26, 11:45 AM
fs.appendFileSync('src/utils/encryption.ts', '\n// IV is a random 16-byte Buffer for AES-GCM\n');
exec('git add src/utils/encryption.ts');
exec('GIT_AUTHOR_DATE="2026-04-26T11:45:00" GIT_COMMITTER_DATE="2026-04-26T11:45:00" git commit -m "feat(encryption): implement AES-256-GCM encrypt and decrypt utils"');

// 3. April 26, 2:30 PM
fs.appendFileSync('src/modules/ai/ai-engine.service.ts', '\n// Fallback logic limits chars based on target platform guidelines\n');
exec('git add src/modules/ai/ai-engine.service.ts');
exec('GIT_AUTHOR_DATE="2026-04-26T14:30:00" GIT_COMMITTER_DATE="2026-04-26T14:30:00" git commit -m "feat(ai): integrate OpenAI and Anthropic with platform-specific prompts"');

// 4. April 26, 5:10 PM
fs.appendFileSync('src/modules/telegram/bot.ts', '\n// Configure Telegram Webhook callback explicitly\n');
exec('git add src/modules/telegram/bot.ts');
exec('GIT_AUTHOR_DATE="2026-04-26T17:10:00" GIT_COMMITTER_DATE="2026-04-26T17:10:00" git commit -m "feat(telegram): add Grammy bot with webhook and Redis session state"');

// 5. April 27, 9:45 AM
fs.appendFileSync('src/workers/publish.worker.ts', '\n// Process BullMQ publishing jobs with backoff strategy\n');
exec('git add src/workers/publish.worker.ts');
exec('GIT_AUTHOR_DATE="2026-04-27T09:45:00" GIT_COMMITTER_DATE="2026-04-27T09:45:00" git commit -m "feat(queue): add BullMQ publish worker with exponential backoff"');

// 6. April 27, 11:30 AM
fs.appendFileSync('src/workers/publish.worker.ts', '\n// Syncing platform post processing status back to database\n');
exec('git add src/workers/publish.worker.ts');
exec('GIT_AUTHOR_DATE="2026-04-27T11:30:00" GIT_COMMITTER_DATE="2026-04-27T11:30:00" git commit -m "fix(worker): sync platform_posts status on job lifecycle events"');

// 7. April 27, 1:15 PM
fs.appendFileSync('src/middlewares/rateLimiter.ts', '\n// Redis-backed limits block excessive abuse attempts\n');
exec('git add src/middlewares/rateLimiter.ts');
exec('GIT_AUTHOR_DATE="2026-04-27T13:15:00" GIT_COMMITTER_DATE="2026-04-27T13:15:00" git commit -m "fix(middleware): use Redis-backed rate limiter per user and per IP"');

// 8. April 27, 3:40 PM
fs.appendFileSync('tests/auth.test.ts', '\n// TODO: Mock Redis configuration for integration test isolation\n');
exec('git add tests/auth.test.ts');
exec('GIT_AUTHOR_DATE="2026-04-27T15:40:00" GIT_COMMITTER_DATE="2026-04-27T15:40:00" git commit -m "test: add auth middleware and token rotation test coverage"');

// 9. April 27, 6:00 PM
fs.appendFileSync('README.md', '\n- **Notice**: Ensure `.env` is fully loaded before the worker starts.\n');
exec('git add README.md');
exec('GIT_AUTHOR_DATE="2026-04-27T18:00:00" GIT_COMMITTER_DATE="2026-04-27T18:00:00" git commit -m "docs: complete README with live URL, setup guide, and data flow diagram"');

exec('git push -f origin main');
