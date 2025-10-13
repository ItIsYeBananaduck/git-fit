# Quickstart: Strictly Adhere to Constitution

## Overview

This feature implements all 15 tasks for the Adaptive Fit app, ensuring strict adherence to the constitution. It includes social feed, avatar, scoring, rest periods, access control, workout card, strain sync, labs, food entry, marketplace, play mode, subscriptions, trainer flows, training import, and CSV plans.

## Prerequisites

- Node.js 18+
- Python 3.10+
- Capacitor CLI
- Fly.io account
- Convex setup

## Setup

1. Clone the repo and checkout branch `019-strictly-adhere-to`
2. Install dependencies: `pnpm install`
3. Set up Convex: `npx convex dev`
4. Deploy API to Fly.io: `./deploy.sh`
5. Run tests: `npm test`

## Key Components

- **Frontend**: SvelteKit with Capacitor for mobile
- **Backend**: Fly.io with Node.js/Express
- **AI**: Llama 3.1 8B (4-bit) via Capacitor plugin
- **Database**: Convex for real-time data
- **Payments**: Stripe/Apple Pay integration

## Development

- Use `npm run dev` for frontend
- Use `fly deploy` for backend
- Tests in `contracts/` validate API compliance

## Constitution Compliance

- User-centric design
- Cost-effective ($10-15/month)
- Scalable to 1-10,000 users
- Supports iPhone 7/Android API 19
- <500ms latency, 30 FPS animations
