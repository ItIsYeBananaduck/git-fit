# Adaptive Fit - Implementation of 15 Tasks

This repository implements the 15 tasks for the Adaptive Fit fitness app, adhering to the project constitution.

## Project Structure

- `app/src/components/` - Svelte components
- `api/` - Fly.io backend (Node.js)
- `scripts/` - PowerShell scripts for backend tasks
- `specs/` - Feature specifications

## Setup

### Prerequisites

- Node.js 18+
- PowerShell 7+
- Fly.io CLI (`flyctl`)
- Capacitor CLI
- Llama 3.1 8B (4-bit) model for local AI (download and set path)

### Backend Setup (Fly.io)

1. Navigate to `api/`:
   ```bash
   cd api
   npm install
   ```

2. Set environment variables in `.env`:
   ```
   PORT=3000
   STRIPE_SECRET_KEY=your_stripe_key
   YOUTUBE_API_KEY=your_youtube_key
   PUBMED_API_KEY=your_pubmed_key
   LLAMA_MODEL_PATH=/path/to/llama-3.1-8b-4bit.bin
   ```

3. Deploy to Fly.io:
   ```bash
   flyctl launch
   flyctl deploy
   ```

### Frontend Setup (SvelteKit + Capacitor)

1. Navigate to `app/`:
   ```bash
   cd app
   npm install
   ```

2. Configure Capacitor:
   - Add platforms: `npx cap add ios` and `npx cap add android`
   - Sync: `npx cap sync`

3. For Llama integration on mobile:
   - Use Capacitor plugin for local ML (e.g., custom plugin for llama.cpp)

4. Run development:
   ```bash
   npm run dev
   ```

5. Build for mobile:
   ```bash
   npm run build
   npx cap sync
   npx cap open ios  # or android
   ```

### Testing

- Unit tests: `npm test` in `app/`
- API tests: Use Supertest in `api/`
- Low-end device testing: Use browser dev tools to simulate slow devices

### Llama 3.1 Integration

Replace mock functions in `api/server.js` and `app/src/components/AliceAvatar.svelte` with actual Llama calls using llama.cpp or similar library.

### Notes

- All AI features use Llama 3.1 8B (4-bit, local) instead of GPT-2.
- Payments via Stripe/Apple with specified fees.
- No duplicates/conflicts as per constitution.
- Canvas fallbacks for low-end devices.
