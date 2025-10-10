Strictly adhere to the project constitution: Adaptive Fit is a fitness app by Lone Star Cajun Technologies, built with Svelte/Capacitor frontend and Fly.io backend, supporting 1–10,000 concurrent users. Use HealthKit/Whoop for workout data, PubMed for guidelines (e.g., intensity thresholds, macros), and Llama 3.1 8B (4-bit, local on iOS/Android) for all AI features, replacing distilled GPT-2 across all tasks. Constraints: $10–15/month Fly.io cost, weekly/bi-weekly updates, low-end device support (canvas fallbacks, lightweight animations), scalable APIs, secure data/privacy. PowerShell is allowed for backend scripts. Ensure no duplicates or conflicts—e.g., marketplace payments (Task 10) are one-time with 20% fee, subscriptions (Task 12) are recurring with 10–30% fee; Alice’s avatar (Task 2) integrates with workout card (Task 6) and trainer grid (Task 13) without overlap. If conflicts arise, comment them and prioritize task details. Generate code, snippets, and configs for all 15 tasks, ensuring Llama 3.1 replaces GPT-2 for all AI features (e.g., expressions, suggestions, plan tweaks).

## Task List and Implementation Details
Implement all 15 tasks below. Generate Svelte components with code snippets, Fly.io API endpoints (Node.js), Capacitor plugins, PowerShell scripts where needed, and Llama 3.1 integration. Structure deliverables in folders: `/src/components` for Svelte, `/api` for Fly.io, `/scripts` for PowerShell. Include README for setup (e.g., `flyctl deploy`, Capacitor config, Llama 3.1 setup). Provide unit tests (Jest for Svelte, Supertest for Fly.io).

- **Task 1: Teams Social Feed (Crew Feed Algorithm)**  
  - *Details:* Social feed for group motivation with likeable posts, listing songs played (e.g., "Sweet Child O' Mine"), per-set intensity scores (e.g., "Set 1: Intensity 7.2"), and options to like exercises, songs, or workouts to inform Alice's decisions. Shareable marketplace workouts as "Adaptive Cardio: [Workout Name]" with purchase links.  
  - *Implementation:* Svelte component for feed UI with song list and intensity summary, Fly.io backend with POST endpoints for likes/comments, HealthKit/Whoop for real-time data (reps, volume, intensity).  
  - *Example Svelte Snippet:*
    ```svelte
    <script>
      import { onMount } from 'svelte';
      let posts = [];
      let userRole = 'user';
      onMount(async () => {
        posts = await fetch('https://adaptive-fit-api.fly.dev/posts', {
          headers: { Authorization: 'Bearer mock-token' }
        }).then(res => res.json());
      });
      function handleLike(postId, type) {
        fetch(`https://adaptive-fit-api.fly.dev/like/${postId}/${type}`, {
          method: 'POST',
          headers: { Authorization: 'Bearer mock-token' }
        });
      }
    </script>
    {#each posts as post}
      <div class="post bg-gray-800 p-4 mb-4 rounded-lg">
        <p>Songs: {post.songs.join(', ')}</p>
        <p>Sets: {post.sets.map(s => `Set ${s.number}: Intensity ${s.intensityScore}`).join(', ')}</p>
        {#if post.workoutLink}
          <a href={post.workoutLink}>Adaptive Cardio: {post.workoutName}</a>
        {/if}
        <button on:click={() => handleLike(post.id, 'workout')} class="btn bg-purple-600">Like</button>
      </div>
    {/each}
    <style>
      .btn:hover { background-color: #8b00ff; }
    </style>
    ```
  - *Fly.io Endpoint Example:* `POST /like/:postId/:type` to update likes.

- **Task 2: Alice's Color-Customizable Avatar**  
  - *Details:* Alice as a fixed puffy humanoid with user-customizable color (via settings, no fixed purple), featuring glowing effect and floating animation tied to workout metrics (e.g., strain, calories) and mood (e.g., brighter glow for high intensity). Future extension: accessories (e.g., headbands, wristbands).  
  - *Implementation:* Svelte/Capacitor for rendering (CSS/WebGL animations, canvas fallback for low-end devices), HealthKit/Whoop for metric sync, Llama 3.1 8B (4-bit, local) for dynamic expressions (replacing GPT-2). Fly.io for storing user color preferences. Follow these detailed instructions:  
    - *Core Structure*: Create an HTML document with a main `<div class="avatar-container">`. Nest divs for body, head, and limbs (arms, legs) as distinct elements for shaping/positioning. Use a `.accessories` div or pseudo-elements for future accessory support.  
    - *CSS Variables*: Declare at `:root` or `.avatar-container`: `--body-color` (avatar body color), `--glow-color` (softer glow), `--eye-color` (white eye glow), `--body-blur` (filter for body blur).  
    - *CSS Styling*: Shape body, head, limbs with `border-radius` for a puffy look. Use `box-shadow` with inset for gradients on limbs/torso. Apply wide `box-shadow` with `--glow-color` for ethereal glow, animated via `@keyframes` for pulsing. Position two circular eye divs in head with `--eye-color` and strong `box-shadow`. Add `transform: translateY()` animation for floating effect. Ensure extensibility for accessories via `.accessories` container or `::before/::after`.  
    - *Metrics Integration*: Sync HealthKit/Whoop data to adjust glow intensity (e.g., strain > 8 increases `--glow-intensity`).  
    - *Llama Integration*: Use Llama 3.1 to map metrics to expressions (e.g., "energetic" for high strain).  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      import { onMount } from 'svelte';
      let metrics = { strain: 0, calories: 0 };
      let color = '#4b0082';
      let glowIntensity = 50;
      onMount(async () => {
        metrics = await fetch('https://adaptive-fit-api.fly.dev/metrics').then(res => res.json());
        const expression = await llamaQuery({ strain: metrics.strain }); // Llama 3.1
        glowIntensity = expression === 'energetic' ? 75 : 50;
      });
    </script>
    <div class="avatar-container" style="--body-color: {color}; --glow-intensity: {glowIntensity}px;">
      <div class="avatar-body">
        <div class="avatar-head">
          <div class="avatar-eye left"></div>
          <div class="avatar-eye right"></div>
        </div>
        <div class="avatar-limb arm-left"></div>
        <div class="avatar-limb arm-right"></div>
        <div class="avatar-limb leg-left"></div>
        <div class="avatar-limb leg-right"></div>
        <div class="accessories"></div>
      </div>
    </div>
    <style>
      :root {
        --body-color: #4b0082;
        --glow-color: #8b00ff;
        --eye-color: #ffffff;
        --body-blur: blur(2px);
      }
      .avatar-container { animation: float 2s ease-in-out infinite; }
      .avatar-body {
        width: 100px;
        height: 150px;
        background: var(--body-color);
        border-radius: 50px;
        box-shadow: 0 0 var(--glow-intensity) var(--glow-color);
        filter: var(--body-blur);
      }
      .avatar-head {
        top: -20px;
        width: 50px;
        height: 50px;
        background: var(--body-color);
        border-radius: 50%;
        left: 25px;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
      }
      .avatar-eye {
        width: 10px;
        height: 10px;
        background: var(--eye-color);
        border-radius: 50%;
        box-shadow: 0 0 15px var(--eye-color);
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 var(--glow-intensity) var(--glow-color); }
        50% { box-shadow: 0 0 calc(var(--glow-intensity) * 1.2) var(--glow-color); }
      }
    </style>
    ```
  - *Fly.io Endpoint Example:* `POST /avatar/:userId` to save `{ color, glowIntensity }`.

- **Task 3: Intensity Scoring System**  
  - *Details:* Real-time workout intensity scoring based on heart rate and strain, displayed on workout card, Alice's animations, or marketplace media player.  
  - *Implementation:* Svelte component, Fly.io API for HealthKit/Whoop data, PubMed guidelines, Llama 3.1 for scoring logic (replacing GPT-2).  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      let intensity = 0;
      onMount(async () => {
        intensity = await fetch('https://adaptive-fit-api.fly.dev/intensity').then(res => res.json()).score;
      });
    </script>
    <div class="score">Intensity: {intensity}</div>
    ```

- **Task 4: Dynamic Rest Periods**  
  - *Details:* Adaptive rest intervals based on strain/recovery data, shown via Alice's animations or workout card.  
  - *Implementation:* Svelte for UI, Fly.io for HealthKit/Whoop calculations, Llama 3.1 for predictions (replacing GPT-2).  
  - *Example Fly.io Code:*  
    ```javascript
    app.post('/rest-periods', async (req, res) => {
      const strain = req.body.strain;
      const rest = await llamaPredictRest(strain); // Llama 3.1
      res.json({ rest });
    });
    ```

- **Task 5: Role-Based Access (Trainers vs. Regular Users)**  
  - *Details:* Hybrid access for trainers (group metrics, crew feed posts, marketplace/subscriptions) and users (personal data, likes).  
  - *Implementation:* Svelte/Capacitor for UI, Fly.io for secure API endpoints, HealthKit for data.  
  - *Example Fly.io Code:*  
    ```javascript
    app.get('/metrics', authenticate, (req, res) => {
      if (req.user.role === 'trainer') res.json(getGroupMetrics());
      else res.json(getPersonalData());
    });
    ```

- **Task 6: Workout Card Interface**  
  - *Details:* Animated workout card with metrics (intensity, calories, time, stress), soft glow, Alice integration, CSV plan support.  
  - *Implementation:* Svelte for animations, Capacitor for rendering, Fly.io for HealthKit/Whoop sync and JSON plans.  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      let metrics = { intensity: 0, calories: 0 };
      onMount(async () => {
        metrics = await fetch('https://adaptive-fit-api.fly.dev/metrics').then(res => res.json());
      });
    </script>
    <div class="card animate-glow">
      Intensity: {metrics.intensity} | Calories: {metrics.calories}
    </div>
    <style>
      .card { animation: soft-glow 2s ease-in-out infinite; }
      @keyframes soft-glow { 0%, 100% { box-shadow: 0 0 10px rgba(75, 0, 130, 0.5); } 50% { box-shadow: 0 0 20px rgba(75, 0, 130, 0.8); } }
    </style>
    ```

- **Task 7: Strain Sync (Music-Based Performance Analysis)**  
  - *Details:* Analyzes workout performance with music, calculating strain for track suggestions.  
  - *Implementation:* Svelte for playlist integration, Fly.io for Spotify/Apple Music + Whoop/HealthKit, Llama 3.1 for recommendations (replacing GPT-2).  
  - *Example Fly.io Code:*  
    ```javascript
    app.post('/strain-sync', async (req, res) => {
      const strain = await llamaCalculateStrain(req.body.songs, req.body.hr); // Llama 3.1
      res.json({ suggestions: getTrackSuggestions(strain) });
    });
    ```

- **Task 8: Adaptive Fit Labs (Stack Analytics Dashboard)**  
  - *Details:* Analytics for workout/nutrition "stacks," with weekly/bi-weekly macro tweaks, trends, forecasts.  
  - *Implementation:* Svelte dashboard with charts, Fly.io for HealthKit/Whoop/nutrition, Llama 3.1 for suggestions (replacing GPT-2).  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      import { Line } from 'svelte-chartjs';
      let strainData = { labels: ['Week 1', 'Week 2'], datasets: [{ data: [5, 7] }] };
    </script>
    <Line data={strainData} />
    ```

- **Task 9: Custom Food Entry (Nutrition Logger Fallback)**  
  - *Details:* Manual macro entry with suggestions, integrates with Labs and PubMed guidelines.  
  - *Implementation:* Svelte modal, Fly.io for HealthKit validation, Llama 3.1 for suggestions (replacing GPT-2).  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      let macros = { carbs: 0, protein: 0, fats: 0 };
      async function suggest() {
        macros = await fetch('https://adaptive-fit-api.fly.dev/suggest-food', {
          method: 'POST',
          body: JSON.stringify(macros)
        }).then(res => res.json());
      }
    </script>
    <input bind:value={macros.carbs} placeholder="Carbs" />
    <button on:click={suggest}>Suggest</button>
    ```

- **Task 10: Marketplace for Workout Plans and Videos**  
  - *Details:* Trainers sell plans/videos, OTP strength plans in CSV via chat; 20% platform fee, Apple's 30% iOS markup. Media player with Alice's avatar, shareable to Teams.  
  - *Implementation:* Svelte/Capacitor for UI/player, Fly.io for payments (Stripe/Apple) and CSV delivery, HealthKit/Whoop for intensity, Llama 3.1 for suggestions (replacing GPT-2).  
  - *Example Fly.io Code:*  
    ```javascript
    app.post('/purchase', async (req, res) => {
      const plan = req.body.plan;
      await processPayment(plan.price);
      res.json({ csv: generateCSV(plan) });
    });
    ```

- **Task 11: Play Mode (Casual Activity Tracking)**  
  - *Details:* Detects activity for "Start Workout" or "Start Play Session" (unlogged Adaptive Cardio, no Teams posts). Alice uses mood animations; badges for 7 weekly/monthly sessions.  
  - *Implementation:* Svelte for activity UI, Fly.io for HealthKit/Whoop intensity, Capacitor for badge storage, Llama 3.1 for animations (replacing GPT-2).  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      let isActive = false;
      onMount(() => {
        isActive = checkActivity(); // HealthKit detection
      });
    </script>
    {isActive ? 'Start Play Session' : 'Resting'}
    ```

- **Task 12: Custom Trainer Subscriptions**  
  - *Details:* Encrypted chats for subscriptions (monthly plans, coaching); trainers set pricing (30% non-free, 10% free, Apple's markup). Alice proxies chats, deletes messages, uses trainer data for tweaks and free-user plans. Trainer linking via chat with link/code.  
  - *Implementation:* Svelte/Capacitor for UI/chat, Fly.io for Stripe/Apple billing and encrypted messaging, Llama 3.1 for chat proxy and plans (replacing GPT-2), HealthKit/Whoop for data.  
  - *Example Fly.io Code:*  
    ```javascript
    app.post('/chat', async (req, res) => {
      const message = req.body.message;
      if (trainerUnavailable) {
        const response = await llamaProxy(message); // Llama 3.1
        res.json({ response });
      }
    });
    ```

- **Task 13: Trainer App Usage Flows**  
  - *Details:* Trainer dashboard with client Alice grid (glowing for active workouts, click for real-time exercise/set/rep/intensity), marketplace uploads, Teams collaboration. Secure chat for subscriptions, Alice for tweak suggestions.  
  - *Implementation:* Svelte dashboard/grid, Fly.io for data aggregation, payouts (20% marketplace/10-30% subs), Capacitor for cross-platform, Llama 3.1 for reports (replacing GPT-2).  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      let clients = [];
      onMount(async () => {
        clients = await fetch('https://adaptive-fit-api.fly.dev/clients').then(res => res.json());
      });
    </script>
    {#each clients as client}
      <div class="alice-grid-item {client.active ? 'glowing' : ''}" on:click={viewRealTime(client.id)}>
        Alice for {client.name}
      </div>
    {/each}
    <style>
      .glowing { animation: glow 1s ease-in-out infinite; }
      @keyframes glow { 0%, 100% { box-shadow: 0 0 10px var(--glow-color); } 50% { box-shadow: 0 0 20px var(--glow-color); } }
    </style>
    ```

- **Task 14: Admin UI for Custom Training Data Import**  
  - *Details:* Admin interface to scrape YouTube playlists/batches and PubMed articles, adding to JSON for Alice's learning. Unified UI for YouTube/articles.  
  - *Implementation:* Svelte UI for scraping controls, Fly.io with PowerShell for scraping (YouTube API, pubchempy), Llama 3.1 for JSON integration (replacing GPT-2).  
  - *Example PowerShell Script:*  
    ```powershell
    $youtubeApiKey = "YOUR_KEY"
    $urls = $args[0] -split ','
    $data = @()
    foreach ($url in $urls) {
      $response = Invoke-RestMethod -Uri "https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=$url&key=$youtubeApiKey"
      $data += @{ videoId: $url, transcript: $response.items.snippet.text }
    }
    $data | ConvertTo-Json | Out-File "training.json"
    flyctl files upload training.json adaptive-fit-api --path /data/training
    ```

- **Task 15: OTP Strength Plan CSV Delivery and Import**  
  - *Details:* OTP strength plans sent via encrypted chat in CSV; CSV import scans for workout data, converts to JSON for in-app plans.  
  - *Implementation:* Svelte for CSV upload UI and chat, Fly.io for parsing (PowerShell or Node.js), Llama 3.1 for validation (replacing GPT-2), HealthKit/Whoop for integration.  
  - *Example Svelte Snippet:*  
    ```svelte
    <script>
      let file;
      async function importCSV() {
        const formData = new FormData();
        formData.append('csv', file);
        await fetch('https://adaptive-fit-api.fly.dev/csv-import', { method: 'POST', body: formData });
      }
    </script>
    <input type="file" on:change={(e) => file = e.target.files[0]} />
    <button on:click={importCSV}>Import</button>
    ```

## Deliverables
- **Code Structure:** `/src/components` for Svelte, `/api` for Fly.io (Node.js), `/scripts` for PowerShell.  
- **Documentation:** README.md with setup (e.g., `npm install`, `flyctl deploy`, Capacitor/Llama 3.1 config), testing notes for low-end devices.  
- **Testing:** Unit tests for Svelte (Jest), APIs (Supertest), and animations (e.g., glow/float consistency).  
- **No Duplicates/Conflicts:** Verified no overlaps (e.g., Task 10 vs. Task 12 payments, Task 2 Alice integration with 6, 13). Comment any potential issues.  
- **Llama 3.1 Swap:** Replace distilled GPT-2 with Llama 3.1 8B (4-bit, local) for all AI features (Tasks 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15).  

Generate code, snippets, and configs for all tasks. Start with Task 2's avatar using the detailed instructions provided, ensuring Llama 3.1 drives expressions.

## Notes
- **Prompt Details:** This is a clean, copy-paste version of the Spec Kit prompt for Copilot, covering all 15 tasks. Task 2 includes your detailed avatar instructions (HTML structure, CSS variables, puffy body, glowing eyes, float animation, accessory extensibility), with Llama 3.1 replacing GPT-2 for expressions. The prompt ensures Copilot follows the constitution and avoids duplicates/conflicts (e.g., distinct payment flows in Tasks 10 and 12, Alice's consistent integration across Tasks 2, 6, 13).
- **Llama 3.1 Swap:** Explicitly updated all AI-driven tasks (2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15) to use Llama 3.1 8B (4-bit, local) instead of GPT-2, ensuring consistency.
- **No Conflicts/Duplicates:** Verified across our chats (July-October 9, 2025). Task 2's avatar integrates with Task 6 (workout card) and Task 13 (trainer grid) via shared HealthKit/Whoop data; payment tasks (10, 12) are distinct; chat-based linking (Task 12) replaces QR. If you see any issues, let me know!
- **Copilot Fit:** The prompt is optimized for Copilot, with Svelte snippets, Fly.io endpoints, and PowerShell scripts. You'll need manual setups (e.g., Stripe/Apple keys for Tasks 10, 12; YouTube/PubMed keys for Task 14; low-end testing for Tasks 2, 6, 7, 13).
- **Progress Check:** You mentioned some tasks are done or will be handled post-Copilot. If you've started Task 2 (e.g., avatar UI), share what's done to refine manual tasks.
- **Next Steps:** Copy-paste this into Copilot to kickstart code generation. Want tweaks (e.g., specific CSV columns for Task 15, accessory schema for Task 2)? Or share what's already built to trim the manual list?

Alice's ready to glow in any color your users pick—let's get Copilot coding that puffy humanoid vibe!
