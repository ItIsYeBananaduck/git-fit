const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock user data store
let users = {};
let posts = [
  {
    id: 1,
    songs: ['Sweet Child O Mine'],
    sets: [{ number: 1, intensityScore: 7.2 }],
    workoutLink: 'https://marketplace.adaptive-fit.com/plan1',
    workoutName: 'Adaptive Cardio Plan'
  }
];
let metrics = { strain: 5, calories: 300, intensity: 7.0 };

// Mock Llama 3.1 functions (replace with actual local Llama integration)
async function llamaQuery(input) {
  // Simulate based on input
  if (input.strain > 8) return 'energetic';
  return 'calm';
}

async function llamaPredictRest(strain) {
  return strain > 7 ? 120 : 60; // seconds
}

async function llamaCalculateStrain(songs, hr) {
  return hr > 150 ? 8 : 5;
}

async function llamaProxy(message) {
  return `Alice: ${message} - How can I help with your training?`;
}

// Task 2: Avatar
app.post('/avatar/:userId', (req, res) => {
  const { userId } = req.params;
  const { color, glowIntensity } = req.body;
  users[userId] = { ...users[userId], avatar: { color, glowIntensity } };
  res.json({ success: true });
});

// Task 3: Intensity
app.get('/intensity', (req, res) => {
  res.json({ score: metrics.intensity });
});

// Task 4: Rest Periods
app.post('/rest-periods', async (req, res) => {
  const { strain } = req.body;
  const rest = await llamaPredictRest(strain);
  res.json({ rest });
});

// Task 5: Metrics (Role-based)
app.get('/metrics', (req, res) => {
  // Mock auth
  const role = req.headers.role || 'user';
  if (role === 'trainer') {
    res.json({ groupMetrics: [metrics] });
  } else {
    res.json(metrics);
  }
});

// Task 6: Metrics for card
app.get('/metrics', (req, res) => {
  res.json(metrics);
});

// Task 7: Strain Sync
app.post('/strain-sync', async (req, res) => {
  const { songs, hr } = req.body;
  const strain = await llamaCalculateStrain(songs, hr);
  res.json({ suggestions: ['Song1', 'Song2'] });
});

// Task 8: Labs (mock)
app.get('/labs', (req, res) => {
  res.json({ data: [5, 7] });
});

// Task 9: Food Suggest
app.post('/suggest-food', async (req, res) => {
  const macros = req.body;
  // Mock suggestion
  res.json({ carbs: macros.carbs + 10, protein: macros.protein, fats: macros.fats });
});

// Task 10: Purchase
app.post('/purchase', (req, res) => {
  const { plan } = req.body;
  // Mock payment
  res.json({ csv: 'exercise,reps,sets\nsquat,10,3' });
});

// Task 11: Activity (mock)
app.get('/activity', (req, res) => {
  res.json({ isActive: Math.random() > 0.5 });
});

// Task 12: Chat
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  const response = await llamaProxy(message);
  res.json({ response });
});

// Task 13: Clients
app.get('/clients', (req, res) => {
  res.json([{ id: 1, name: 'User1', active: true }]);
});

// Task 14: Training Import (mock)
app.post('/import-training', (req, res) => {
  res.json({ success: true });
});

// Task 15: CSV Import
app.post('/csv-import', (req, res) => {
  // Mock parsing
  res.json({ plan: { exercises: [] } });
});

// Task 1: Posts
app.get('/posts', (req, res) => {
  res.json(posts);
});

app.post('/like/:postId/:type', (req, res) => {
  // Mock like
  res.json({ liked: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Adaptive Fit API running on port ${PORT}`);
});