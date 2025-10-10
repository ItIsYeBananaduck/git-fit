# Phase 0: Research & Analysis

## Technology Decisions

### Component Architecture: Extend AliceUnified.svelte

**Decision**: Extend existing AliceUnified.svelte component with card view mode rather than creating new component  
**Rationale**:

- Follows constitution principle of existing code analysis and prevents duplication
- AliceUnified already has complete workout data structure (WorkoutData, Exercise, WorkoutSet interfaces)
- Current implementation supports morphing, animations, and interactive workout controls
- 1475 lines of existing functionality including progress tracking, intensity/stress scoring
- Preserves current orb functionality while adding card transformation mode

**Alternatives considered**:

- New CardView component: Would duplicate workout logic and state management
- Separate components: Would violate constitution's anti-duplication principle
- Replace AliceUnified: Would break existing functionality and require extensive testing

### Animation Framework: anime.js Integration

**Decision**: Use existing anime.js 4.2.0 dependency for orb-to-card transformation  
**Rationale**:

- Already installed and used in current Alice ecosystem (package.json dependency)
- Excellent support for smooth shape morphing and breathing expansion effects
- Handles complex SVG path transitions required for orb-to-card transformation
- Performance optimized for <1s animation requirement
- Compatible with existing AliceUnified animation system

**Alternatives considered**:

- CSS transitions: Limited for complex expansion animations and 3D effects
- Framer Motion: React-focused, would require additional dependencies
- GSAP: More powerful but heavier bundle size

### Visual Design System: Existing Alice Color Architecture

**Decision**: Leverage existing alice color utilities and HSL manipulation system  
**Rationale**:

- aliceColorUtils.ts already provides generateAliceColorScheme and strain-based color variations
- colorUtils.ts has HSL/RGB conversion functions for iris color matching
- AliceUnified component already supports glow effects and color customization
- DEFAULT_ALICE_COLORS provides consistent theme integration

**Alternatives considered**:

- New color system: Would duplicate existing functionality
- CSS custom properties only: Limited for dynamic color-shifting underglow effects
- Third-party color library: Unnecessary given existing comprehensive utilities

### Layout Strategy: CSS Grid with Responsive Units

**Decision**: Use CSS Grid with viewport width units for responsive card layout  
**Rationale**:

- Supports clarified requirement for "responsive card that uses percentage of screen width"
- CSS Grid provides precise control for 3-section layout (top-left, bottom-left, right-side)
- Existing AliceUnified uses modern CSS approach compatible with this strategy
- Enables smooth transition from circular orb to rectangular card layout
- Supports 3D floating effect with CSS transforms

**Alternatives considered**:

- Flexbox: Less precise for complex multi-section layout requirements
- Absolute positioning: Harder to maintain responsiveness across screen sizes
- Fixed dimensions: Violates clarified responsive sizing requirement

### Progress Data Integration: Existing Sensor+AI Pipeline

**Decision**: Use existing aliceDataService.ts and sensor+AI integration for progress metrics  
**Rationale**:

- Already provides real-time metrics (calories, intensity, stress) through getAliceMetrics()
- aliceDataService has workout session management and real-time data subscription
- Convex alice functions support updateState for progress tracking
- Constitution requires leveraging existing infrastructure over rebuilding

**Alternatives considered**:

- New metrics service: Would violate constitution's cost-effectiveness principle
- Manual data input: Doesn't leverage existing sensor capabilities
- Third-party fitness API: Unnecessary complexity given existing integration

### Interactive Elements: Existing Alice Touch System

**Decision**: Extend existing AliceUnified touch/gesture handling for speech bubble triggers  
**Rationale**:

- AliceUnified already has comprehensive touch interaction system
- Supports tap, swipe, and gesture recognition through Capacitor haptics
- aliceStore.ts manages interaction modes and states
- Follows clarified requirement for "user gesture or tap on Alice" trigger

**Alternatives considered**:

- New interaction system: Would duplicate existing touch handling
- Button-only interface: Violates requirement for gesture-triggered speech bubbles
- Voice activation: Outside scope of current feature requirements

## Integration Points

### Existing AliceUnified Component Extension

**Decision**: Add card view mode as new display state alongside existing orb mode  
**Rationale**:

- AliceUnified already has sophisticated state management (currentShape, morphProgress, isAnimating)
- Workout data structures (WorkoutData, Exercise, WorkoutSet) match card display requirements
- Interactive controls (reps/weight adjustment, skip/complete buttons) already implemented
- Progressive enhancement maintains backward compatibility

### Animation State Management

**Decision**: Extend existing AliceAnimationState interface for card transitions  
**Rationale**:

- anime.js integration already established in Alice ecosystem
- AliceAnimationState supports morphPath, opacity, and transform properties
- Card expansion can reuse existing smooth transition patterns
- Breathing expansion fits existing organic movement system

### Real-Time Progress Display

**Decision**: Use existing AliceDataService real-time subscription for progress bars  
**Rationale**:

- getAliceMetrics() provides calories, intensity, stress data
- Real-time subscription prevents polling overhead
- Existing Convex integration supports live updates
- Color-shifting underglow can use existing strain-based color functions

## Performance Considerations

### Animation Performance

**Decision**: Use CSS transforms and anime.js tweening for 60fps animations  
**Rationale**:

- CSS transforms leverage GPU acceleration for smooth transitions
- anime.js provides optimized animation loops with proper easing
- Existing AliceUnified achieves target performance with current approach
- <1s constraint achievable with current animation architecture

### Memory Management

**Decision**: Reuse existing component instances rather than mounting/unmounting  
**Rationale**:

- AliceUnified already optimized for continuous operation
- View mode switching more efficient than component destruction/recreation
- Existing state management prevents memory leaks
- Follows constitution's scalability requirements (1GB RAM constraint)

## Risk Assessment

### Low Risk Items

- Animation performance: Existing anime.js integration proven
- Color system: Comprehensive existing utilities
- Data integration: Established sensor+AI pipeline
- Touch interaction: Mature gesture handling system

### Medium Risk Items

- Layout complexity: Card layout more complex than current orb
- Responsive behavior: Multiple screen sizes require testing
- Animation blending: Overlapping animations need careful coordination

### Mitigation Strategies

- Progressive enhancement: Start with basic card, add advanced features
- Thorough testing: Focus on animation performance and responsiveness
- Fallback modes: Graceful degradation if animations lag
