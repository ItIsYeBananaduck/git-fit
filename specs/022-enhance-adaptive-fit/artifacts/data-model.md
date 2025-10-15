# Data Model: Enhance Adaptive Fit

## Entities

### User Data

- **Attributes**:
  - `userId` (String): Unique identifier for the user.
  - `dataHash` (String): Tokenized model state hash for identifying user data.
  - `localData` (Object): User data stored locally.
  - `lastSync` (Date): Timestamp of the last successful sync.

### Weekly Weight Sync

- **Attributes**:
  - `userId` (String): Unique identifier for the user.
  - `weightData` (Array): List of weight entries.
  - `syncStatus` (String): Status of the sync (e.g., `pending`, `success`, `failed`).

### Llama 3.1 Model

- **Attributes**:
  - `modelVersion` (String): Version of the Llama 3.1 model.
  - `localPath` (String): Path to the locally stored model.
  - `lastUpdated` (Date): Timestamp of the last model update.

## Relationships

- **User Data ↔ Weekly Weight Sync**:
  - `userId` serves as the foreign key.

- **User Data ↔ Llama 3.1 Model**:
  - `dataHash` links user data to the model state.

## Constraints

- `userId` must be unique across all entities.
- `dataHash` must be consistent for the same user data.
- `syncStatus` must be one of the predefined values (`pending`, `success`, `failed`).
