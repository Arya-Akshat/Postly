# 🚀 Postly — Multi-Platform AI Content Engine

Postly is a powerful backend engine designed to automate social media content generation and publishing across multiple platforms using AI. Built with a robust Node.js/TypeScript stack, it leverages BullMQ and Redis for reliable asynchronous processing.

## ✨ Features

- **Multi-Platform Support:** Generate tailored content for Twitter, LinkedIn, Instagram, and Threads.
- **AI-Powered:** Integration with Groq (Llama 3), OpenAI (GPT-4o), and Anthropic (Claude 3.5).
- **Telegram Bot Interface:** Seamless conversation flow to capture ideas and preview content.
- **Background Publishing:** Robust queue system with automatic retries and status tracking.
- **Secure Key Management:** AES-256-GCM encryption for all sensitive API keys.
- **Monitoring Dashboard:** Real-time metrics and queue status visualization via Streamlit.

## 🛠️ Tech Stack

- **Backend:** Node.js (v20), Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Queue & Cache:** BullMQ + Redis
- **AI Engines:** Groq, OpenAI, Anthropic
- **Testing:** Jest + Supertest
- **Infrastructure:** Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (v20+)
- A Telegram Bot Token (from @BotFather)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Arya-Akshat/Postly.git
   cd Postly
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your keys (GROQ_API_KEY, TELEGRAM_BOT_TOKEN, etc.)
   ```

3. **Spin up Infrastructure:**
   ```bash
   docker-compose up -d
   ```

4. **Install Dependencies & Setup DB:**
   ```bash
   npm install
   npx prisma db push
   ```

5. **Start the Application:**
   ```bash
   # Run both server and worker
   ./start.sh
   ```

### Running Tests
```bash
npm test
```

## 🤖 Telegram Bot Commands

- `/start` - Begin the post creation process.
- `/status` - View the status of your last 5 submissions.
- `/accounts` - List your connected social media profiles.
- `/help` - Show usage instructions.

## 📊 Dashboard
Access the real-time monitoring dashboard by running:
```bash
./run_dashboard.sh
```
The dashboard will be available at `http://localhost:8501`.

---
*Developed for the Credes TechLabs Backend Intern Task.*
