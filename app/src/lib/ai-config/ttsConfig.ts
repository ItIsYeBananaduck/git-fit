// TTS Configuration
export interface TTSConfig {
    voice: 'alice' | 'aiden';
    tone: 'encouraging' | 'firm' | 'steady' | 'pushy';
    rate: number; // 0.1 to 10.0
    pitch: number; // 0.0 to 2.0
    volume: number; // 0.0 to 1.0
    language: string;
}