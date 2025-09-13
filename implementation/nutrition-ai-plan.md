# Nutrition AI Implementation Plan

## Overview

This plan outlines the actionable steps to implement the Nutrition AI system based on the provided specifications.

## Tasks

### Core Calculations

1. Implement TDEE bootstrap using the Mifflin-St Jeor equation.
2. Develop weekly auto-calibration based on weight trends.
3. Create macros calculation logic with training-day carb bias.

### Recovery-Aware Micro-Adjustments

1. Integrate HRV and resting HR data for recovery analysis.
2. Implement logic for carb adjustments based on recovery metrics.
3. Develop hydration and sleep recommendations.

### Food Logging Options

1. Integrate USDA FoodData Central / Open Food Facts.
2. Build quick log mode with portion presets.
3. Allow trainers to upload house foods.

## Tech Stack

- **Backend**: Convex for data storage and processing.
- **APIs**: FoodData Central / Open Food Facts for food logging.
- **Frontend**: Svelte for user interface.

## Timeline

- **Phase 1**: Core Calculations (2 weeks)
- **Phase 2**: Recovery-Aware Micro-Adjustments (2 weeks)
- **Phase 3**: Food Logging Options (2 weeks)
