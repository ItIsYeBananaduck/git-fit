### 🧩 TASK: Mesocycle-Aware Personalized Training System + Native Music Controls

---

#### 📆 MESOCYCLE-BASED PROGRAMMING

**Overview:**
Implement a training logic system where all workout programming, AI summaries, and adjustments operate on a 4–6 week mesocycle basis, not week-to-week.

**Steps:**

- [ ] Add mesocycle duration config (`default: 4 weeks`, user adjustable)
- [ ] Trigger deload week automatically at the end of the mesocycle (unless skipped)
- [ ] Store mesocycle metadata (`startDate`, `cycleLength`, `deloadScheduled`, etc.)

---

#### 🧰 EQUIPMENT & PREFERENCE-BASED EXERCISE FILTERING

**After split selection:**

- [ ] Ask user for equipment available (dumbbell, barbell, cable, machine, etc.)
- [ ] Ask for exercise preferences (include list / avoid list)
- [ ] Store this JSON in the user config file:

```json
{
  "equipment": ["machine", "bodyweight", "dumbbell"],
  "preferredExercises": ["leg_press", "pull_up"],
  "avoidExercises": ["deadlift"]
}
```

When generating a program:

Pull from an exercise pool that matches:

Goal (hypertrophy / strength / etc.)

Equipment availability

Preference list

AI suitability based on prior summary (replace stale or disliked exercises)

🔁 MONTHLY AI ADJUSTMENTS TO EXERCISE POOL
At mesocycle transition:

Pull monthlySummary JSON

Track:

avg + max for sets, reps, load

avgRest

totalVolume

Replace 20–30% of exercises that:

Stalled (no load or volume increase over 2 cycles)

Have low user rating

Have poor strain-to-rep correlation (optional metric)

Update program JSON for new mesocycle with updated exercises

🧠 AI CONFIG SUPPORT
Config stored as JSON string in Convex:

```
{
  "cycleLengthWeeks": 4,
  "deloadAfterCycle": true,
  "exerciseRotationPercent": 0.25,
  "trackRepsSetsLoad": "avg_max",
  "strainNudges": true
}
```

🎧 NATIVE MUSIC PLAYER CONTROLS (IN-WORKOUT)
Add music controls to workout session screen:

Play / Pause

Skip track

Volume up/down

Show current track name + artist

Implementation:

Use Capacitor plugin for media control (cordova-plugin-music-controls2 or modern alternative)

Auto-detect platform: Apple Music (iOS), Spotify, or system player

Store music state per session (optional)

**Note:** Check off each task as you complete it. Update this list as new features/specs are added or completed.
