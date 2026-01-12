# SwasthaLabs - AI Fitness & Nutrition Coach

SwasthaLabs is a high-performance, RAG-ready full-stack subscription platform for personalized Indian diet and workout plans.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Dark Mode)
- **Animations**: Framer Motion
- **Database**: PostgreSQL with `pgvector` (via Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **AI**: Vercel AI SDK + OpenRouter (Gemini 3 Flash + Text Embeddings)
- **Payments**: Razorpay Subscriptions
- **Email**: Resend
- **Form**: Typeform Embed

## 🛠 Features

- **Transactional Job Worker**: Atomic job claiming using `FOR UPDATE SKIP LOCKED`.
- **RAG Pipeline**: PDF ingestion with OpenRouter embeddings and HNSW vector search.
- **Secure Webhooks**: Signature verification for Typeform and Razorpay with idempotency.
- **AI Planner**: Context-aware plan generation using retrieved guide materials.
- **24h Unlock**: Plans generated immediately but locked for 24 hours to simulate "coaching review".
- **AI Coach Chat**: Real-time chat with RAG context awareness.

## 🏁 Getting Started

### 1. Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- OpenRouter API Key
- Razorpay account
- Typeform account
- Resend API Key

### 2. Environment Setup

Copy `env.example` to `.env` and fill in the values:

```bash
cp env.example .env
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Database Setup

Ensure your Postgres instance has `pgvector` enabled.

```bash
npx prisma migrate dev
```

### 5. Start Development Server

```bash
pnpm dev
```

## 📬 API & Webhooks

- **Typeform Webhook**: `/api/webhooks/typeform`
- **Razorpay Webhook**: `/api/webhooks/razorpay`
- **Cron Worker**: `/api/cron/worker` (Process pending intakes/payments)
- **Release Worker**: `/api/cron/release` (Unlock plans and send emails)
- **RAG Ingestion**: `/api/admin/ingest-guides` (Admin only)

## 🧪 Testing

A Postman collection is provided in `swasthalabs.postman_collection.json` for testing webhooks and cron jobs.
