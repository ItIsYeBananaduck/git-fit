# Phase 0: Research & Analysis

## Technology Decisions

### Animation Library: anime.js

**Decision**: Use anime.js for Alice's morphing animations and transitions  
**Rationale**:

- Lightweight and performant for SVG path animations
- Excellent support for morphing between different SVG paths (required for ferrofluid shapes)
- Smooth easing functions for 3-second transitions
- Compatible with Svelte's reactive updates
- Already mentioned in user requirements

**Alternatives considered**:

- Framer Motion: More React-focused, heavier bundle
- GSAP: More powerful but larger bundle size
- CSS transitions: Limited for complex SVG path morphing

### Voice Integration: ElevenLabs API

**Decision**: Integrate ElevenLabs for voice coaching when earbuds are connected  
**Rationale**:

- High-quality voice synthesis for workout encouragement
- API-based integration fits with existing architecture
- Supports custom voice personalities for Alice
- Real-time audio generation for dynamic feedback

**Alternatives considered**:

- Web Speech API: Limited voice quality and customization
- Azure Cognitive Services: More expensive, complex integration
- Local TTS: Limited quality, larger bundle size

### Real-time Data Sync: Convex Subscriptions

**Decision**: Use Convex real-time subscriptions for 1-2 second workout data sync  
**Rationale**:

- Already integrated in the app architecture
- Real-time subscriptions provide automatic updates
- Efficient for frequent strain level updates
- Built-in offline handling capabilities

**Alternatives considered**:

- WebSocket polling: More complex implementation
- REST API polling: Higher latency, less efficient
- Server-sent events: One-way communication only

### Touch Interaction: Capacitor Haptics

**Decision**: Use @capacitor/haptics for tactile feedback on Alice interactions  
**Rationale**:

- Already installed in the project (@capacitor/haptics 7.0.2)
- Native haptic feedback enhances user experience
- Works across iOS and Android platforms
- Lightweight integration with existing touch handlers

**Alternatives considered**:

- Web Vibration API: Limited support, less sophisticated feedback
- Custom implementation: Unnecessary complexity

## Shape Generation Patterns

### SVG Path Morphing for Ferrofluid Effect

**Decision**: Use SVG path morphing with cubic bezier curves  
**Rationale**:

- SVG paths provide smooth, scalable shape transitions
- Cubic bezier curves create organic, fluid appearance
- anime.js has excellent support for path morphing
- Maintains crisp appearance at all sizes (100px minimum)

**Shape Definitions**:

- Neutral blob: Smooth circular with slight organic variations
- Intense pulse: Stretched/elongated with dynamic edges
- Rhythmic ripple: Wave-like undulations synchronized with music

### Color System Architecture

**Decision**: HSL color space with programmatic adjustments  
**Rationale**:

- HSL easier for programmatic color manipulation
- User customization via hue slider (0-360°)
- Strain-based lightness adjustments (±20% based on intensity)
- Maintains accessibility and contrast ratios

## Performance Optimization

### Animation Performance

**Decision**: Use requestAnimationFrame and GPU acceleration  
**Rationale**:

- Smooth 60fps animations required for lifelike appearance
- GPU acceleration for SVG transforms reduces CPU load
- requestAnimationFrame prevents janky animations
- Will-change CSS property for transform optimizations

### Data Sync Throttling

**Decision**: Implement intelligent update throttling for strain changes >15%  
**Rationale**:

- Prevents excessive morphing from rapid data changes
- Maintains smooth user experience
- Reduces animation conflicts and CPU usage
- Clarified in user requirements

## Integration Points

### Existing AliceOrb Component Extension

**Decision**: Extend existing AliceOrb.svelte rather than rewrite  
**Rationale**:

- Follows constitution principle of existing code analysis
- Preserves current functionality while adding new features
- Reduces implementation complexity and testing burden
- Maintains consistency with current app architecture

### Global State Management Integration

**Decision**: Extend existing aliceStore.ts with voice coaching state  
**Rationale**:

- Already created for global Alice state management
- Centralized state prevents conflicts across components
- Easy integration with Convex workout data subscriptions
- Supports offline caching requirements

## Research Unknowns Resolved

1. **Voice coaching scope**: Clarified to include encouragement, form cues, completion feedback, and summaries
2. **Navigation actions**: Defined as app section cycling (Workouts, Nutrition, Progress, Settings)
3. **Data sync frequency**: Specified as real-time (1-2 seconds) for immediate responsiveness
4. **Morphing control**: Limited to significant strain changes (>15% difference)
5. **Offline behavior**: Gray appearance with neutral blob shape when data unavailable

All technical context items now have clear implementation paths with no remaining NEEDS CLARIFICATION items.
