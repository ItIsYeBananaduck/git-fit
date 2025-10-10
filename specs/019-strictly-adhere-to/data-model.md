# Data Model: Strictly adhere to the project constitution and implement all 15 tasks

## Entities

### User
- Fields: id (string), role (trainer|user), email (string), preferences (object)
- Relationships: has many Workouts, has one Avatar, has many Posts (if trainer), has many Subscriptions
- Validation: email format, role enum
- State transitions: active/inactive

### Workout
- Fields: id (string), userId (string), exercises (array), metrics (object: strain, calories, intensity), date (date)
- Relationships: belongs to User, has many Sets
- Validation: date not future, metrics positive numbers

### Avatar
- Fields: userId (string), color (string), glowIntensity (number), accessories (array: {type, color, position, style})
- Relationships: belongs to User
- Validation: color hex format, glowIntensity 0-100

### Post
- Fields: id (string), userId (string), songs (array), sets (array: {number, intensityScore}), workoutLink (string), workoutName (string)
- Relationships: belongs to User
- Validation: songs array of strings

### MarketplacePlan
- Fields: id (string), trainerId (string), name (string), description (string), price (number), csv (string)
- Relationships: belongs to User (trainer)
- Validation: price >0

### Subscription
- Fields: id (string), userId (string), trainerId (string), planId (string), status (active|inactive)
- Relationships: belongs to User, belongs to User (trainer), belongs to MarketplacePlan
- Validation: status enum

### Chat
- Fields: id (string), userId (string), trainerId (string), messages (array: encrypted strings), lastMessage (date)
- Relationships: belongs to User, belongs to User (trainer)
- Validation: messages encrypted

### TrainingData
- Fields: id (string), type (youtube|pubmed), content (object)
- Relationships: none
- Validation: type enum

### CSVPlan
- Fields: id (string), userId (string), csvData (string), parsedExercises (array)
- Relationships: belongs to User
- Validation: csvData valid format