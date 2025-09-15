// Model registry for Nutrition AI
// Tracks model versions, user assignments, and training metadata

export type ModelVersion = {
    id: string;
    version: string;
    createdAt: string;
    description?: string;
    trainingDataSummary?: string;
};

export type UserModelAssignment = {
    userId: string;
    modelId: string;
    assignedAt: string;
    personalized: boolean;
};

// Example: Registry of available models
export const modelRegistry: ModelVersion[] = [
    {
        id: 'model_v1',
        version: '1.0.0',
        createdAt: '2025-09-01T00:00:00Z',
        description: 'Baseline nutrition model',
        trainingDataSummary: 'Global dataset, 10k users',
    },
    {
        id: 'model_v2',
        version: '2.0.0',
        createdAt: '2025-09-10T00:00:00Z',
        description: 'Personalized model with user feedback',
        trainingDataSummary: 'Federated, 2k users',
    },
];

// Example: User assignments (would be stored in DB in production)
export const userModelAssignments: UserModelAssignment[] = [
    {
        userId: 'user_123',
        modelId: 'model_v2',
        assignedAt: '2025-09-15T12:00:00Z',
        personalized: true,
    },
    {
        userId: 'user_456',
        modelId: 'model_v1',
        assignedAt: '2025-09-15T12:00:00Z',
        personalized: false,
    },
];

// Utility: Get model for a user
export function getModelForUser(userId: string): ModelVersion | undefined {
    const assignment = userModelAssignments.find(a => a.userId === userId);
    if (!assignment) return undefined;
    return modelRegistry.find(m => m.id === assignment.modelId);
}

// Utility: Update all personalized models when master model changes
export function updatePersonalizedModelsOnMasterChange(newMasterModel: ModelVersion) {
    // For each user assignment, update modelId and version if personalized
    userModelAssignments.forEach(assignment => {
        if (!assignment.personalized) {
            assignment.modelId = newMasterModel.id;
            assignment.assignedAt = new Date().toISOString();
        }
        // Optionally, trigger retraining for personalized models based on new master
        // assignment.modelId = newMasterModel.id; // Uncomment to force update all
    });
}

// Utility: Add a new master model version and update registry
export function addMasterModelVersion(newModel: ModelVersion) {
    modelRegistry.push(newModel);
    updatePersonalizedModelsOnMasterChange(newModel);
}
