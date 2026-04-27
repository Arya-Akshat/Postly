#!/bin/bash

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

docker-compose down -v
docker-compose up -d postgres redis
sleep 5
npx prisma db push

ngrok http 3000 > /dev/null &
sleep 3

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o '[^"]*$' | head -n 1)
echo "Ngrok URL: $NGROK_URL"

# Use the token from environment
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$NGROK_URL/api/webhooks/telegram/webhook\", \"secret_token\": \"$TELEGRAM_WEBHOOK_SECRET\"}"

npm run dev > dev.log 2>&1 & echo $! > server.pid
npm run worker > worker.log 2>&1 & echo $! > worker.pid
echo "Servers started in background. Logs in dev.log and worker.log."
