// Coach Personality Configuration
export interface CoachPersonality {
    id: 'alice' | 'aiden';
    name: string;
    tagline: string;
    description: string;
    tones: string[];
    avatar: string;
    color: string;
    traits: {
        encouragement: number; // 1-10 scale
        structure: number; // 1-10 scale
        motivation: number; // 1-10 scale
        accountability: number; // 1-10 scale
    };
    preferences: {
        communicationStyle: 'encouraging' | 'direct' | 'balanced';
        feedbackFrequency: 'high' | 'medium' | 'low';
        adaptationSpeed: 'fast' | 'moderate' | 'gradual';
    };
}