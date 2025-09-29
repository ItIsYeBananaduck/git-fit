# Research: AI-Driven Coaching with GPT-2 and ElevenLabs TTS Integration

## Technology Decisions

### GPT-2 Fine-Tuning Approach

**Decision**: Use Hugging Face Transformers with custom fine-tuning pipeline for workout-specific coaching  
**Rationale**:

- Existing DistilGPT-2 model (PhilmoLSC/philmoLSC) provides foundation
- Hugging Face provides robust fine-tuning APIs and model management
- Supports custom training schedules (weekly for pro, monthly for non-pro)
- Can exclude sensitive data during training process
  **Alternatives considered**:
- OpenAI GPT-3/4 API: Too expensive for 10k users, less control over training data
- Local LLM: Resource intensive, harder to scale
- Rule-based responses: Less personalized, doesn't learn from user interactions

### ElevenLabs TTS Integration

**Decision**: Use ElevenLabs API with audio caching and rate limiting strategies  
**Rationale**:

- High-quality voice synthesis for Alice/Aiden personas
- RESTful API supports real-time generation
- Configurable voice settings for persona differentiation
- Reasonable pricing (~$0.22/1k characters) fits budget constraints
  **Alternatives considered**:
- Browser Speech Synthesis API: Lower quality, inconsistent across devices
- AWS Polly: Good quality but more expensive and complex integration
- Azure Cognitive Services: Similar costs but less voice customization

### Earbud Detection Strategy

**Decision**: Use Web Audio API with MediaDevices.getUserMedia() for audio output detection  
**Rationale**:

- Cross-platform support in Capacitor apps
- Can detect audio output device changes
- Non-intrusive permissions request
- Fallback gracefully to visual toasts only
  **Alternatives considered**:
- Native device APIs: Platform-specific implementation, more complex
- Bluetooth API: Limited browser support, privacy concerns
- User preference setting: Less automated, requires manual configuration

### Audio Caching Architecture

**Decision**: Client-side MP3 caching with Capacitor Filesystem API and CDN fallback  
**Rationale**:

- Reduces ElevenLabs API calls for common onboarding sequences
- Improves latency for repeated interactions
- Capacitor Filesystem provides cross-platform storage
- CDN ensures availability and reduces bandwidth costs
  **Alternatives considered**:
- Server-side caching: Increases hosting costs, latency for first-time users
- No caching: Higher API costs, inconsistent latency
- IndexedDB: More complex implementation, less reliable on mobile

### Content Filtering Implementation

**Decision**: Implement multi-layer content filtering with predefined fallback responses  
**Rationale**:

- Client-side keyword filtering for immediate blocking
- Server-side sentiment analysis for context-aware filtering
- Predefined safe responses maintain coaching flow
- Logging for model improvement without storing inappropriate content
  **Alternatives considered**:
- Manual review: Too slow for real-time coaching
- Third-party content filtering: Additional cost and dependency
- No filtering: Unacceptable risk for user experience

### Rate Limiting and Prioritization

**Decision**: Implement request batching with subscription-based priority queues  
**Rationale**:

- Reduces API costs through batching efficiency
- Pro users get priority processing for better experience
- Graceful degradation maintains service for all users
- Queue persistence prevents request loss during rate limits
  **Alternatives considered**:
- First-come-first-served: Unfair to paying customers
- Simple throttling: Poor user experience during peak usage
- Unlimited requests: Budget and API limit violations

## Integration Patterns

### Convex Backend Integration

**Pattern**: Reactive real-time subscriptions for workout data and AI triggers  
**Implementation**:

- Convex mutations for workout event logging
- Real-time queries for user subscription status
- Serverless functions for AI model training coordination
- Encrypted storage for sensitive trainer communications

### Mobile App Architecture

**Pattern**: Service-oriented architecture with dependency injection  
**Implementation**:

- AICoachingService for GPT-2 text generation
- TTSService for ElevenLabs audio synthesis
- AudioService for earbud detection and playback
- ToastService for universal notification display
- SubscriptionService for pro user validation

### Privacy and Compliance Framework

**Pattern**: Data minimization with explicit exclusion policies  
**Implementation**:

- Anonymization pipeline before AI training
- 30-day deletion workflow for GDPR requests
- Opt-out mechanisms with immediate effect
- Audit logging for compliance verification
- Encryption for all sensitive data in transit and at rest

## Performance Optimization Strategies

### Latency Reduction

- Pre-generate common responses during low-traffic periods
- Use CDN for cached audio files
- Implement request deduplication for similar prompts
- Optimize GPT-2 model size vs quality tradeoff

### Scalability Approaches

- Horizontal scaling of Convex functions
- Load balancing for ElevenLabs API calls
- Caching layers at multiple levels (client, CDN, server)
- Asynchronous processing for non-critical operations

### Resource Management

- Memory-efficient audio codec selection
- Intelligent cache eviction policies
- Connection pooling for external APIs
- Background processing for AI model updates

## Risk Mitigation

### API Availability

- Fallback to browser TTS when ElevenLabs unavailable
- Graceful degradation to text-only mode
- Cached responses for critical user flows
- Health monitoring and automatic failover

### Privacy and Security

- Zero-knowledge architecture for sensitive data
- Regular security audits and penetration testing
- Compliance monitoring and automated reporting
- User data portability and deletion tools

### Model Quality

- A/B testing for response quality
- User feedback integration for model improvement
- Fallback to rule-based responses for edge cases
- Regular model validation against safety criteria
