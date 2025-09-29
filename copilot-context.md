# AdaptiveFit AI Coaching Development Guidelines

Auto-generated from feature plans. Last updated: 2024-12-29

## Active Technologies

**Frontend/Mobile**: Svelte/SvelteKit, Capacitor, TypeScript  
**Backend**: Convex (database + serverless), Node.js 18+  
**AI Services**: GPT-2 (Hugging Face Transformers), ElevenLabs TTS API, Python 3.10  
**Testing**: Vitest (Svelte), Jest (Node.js), pytest (Python)  
**Deployment**: Mobile (iOS/Android via Capacitor), Web dashboard  
**Media**: @capacitor-community/media for audio recording  
**Authentication**: Convex Auth  
**Storage**: Convex database, MP3 cache for audio files

## Project Structure

```
app/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte components
│   │   ├── services/          # Business logic, API calls
│   │   ├── stores/            # Svelte stores for state
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Helper functions
│   └── routes/                # SvelteKit pages
├── convex/                    # Backend (Convex)
│   ├── functions/             # API endpoints
│   ├── schema.ts              # Database schema
│   └── _generated/            # Auto-generated types
├── static/                    # Static assets
└── android/ios/               # Capacitor mobile platforms

specs/003-ai-coaching-gpt2-elevenlabs-integration/
├── plan.md                    # Implementation plan
├── research.md                # Technology decisions
├── data-model.md              # Entity definitions
├── quickstart.md              # Testing scenarios
└── contracts/                 # API specifications
```

## Commands

**Development**:

```bash
pnpm dev                      # Start SvelteKit dev server
npx convex dev               # Start Convex backend
npx cap run ios             # Run on iOS simulator
npx cap run android         # Run on Android emulator
```

**Testing**:

```bash
pnpm test                    # Run Vitest tests
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests
```

**Build**:

```bash
pnpm build                  # Build for production
npx cap sync               # Sync with mobile platforms
```

## Code Style

**TypeScript**: Strict mode enabled, prefer interfaces over types  
**Svelte**: Composition API pattern, stores for shared state  
**Convex**: Use generated types, implement proper error handling  
**Python**: Black formatter, type hints required, pytest for testing

## Recent Changes

1. **AI Coaching Integration (Current)**: Added GPT-2 + ElevenLabs TTS support with dual personas (Alice/Aiden), <500ms latency requirements, GDPR compliance framework

2. **Admin System Enhancement**: Comprehensive admin panel with user management, analytics, moderation tools, and audit trails

3. **Mobile Platform**: Capacitor integration for iOS/Android deployment with native audio capabilities

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
