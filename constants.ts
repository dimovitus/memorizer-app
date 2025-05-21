import type { AIProviderConfig } from './types';

export const LOCAL_STORAGE_WORDS_KEY = 'foreignWordsAppWords';
export const GAMIFICATION_DAILY_GOAL = 5; // Number of words to learn to complete daily goal
export const GAMIFICATION_DATA_KEY = 'foreignWordsAppGamificationData';

// SRS Constants
export const SRS_INITIAL_EASE_FACTOR = 2.5;
export const SRS_MIN_EASE_FACTOR = 1.3;
export const SRS_EASE_PENALTY_ON_WRONG = 0.2;
export const SRS_CORRECT_STREAK_INTERVALS: { [key: number]: number } = { // days
  1: 1, // After 1st correct answer, show in 1 day
  2: 6, // After 2nd correct answer, show in 6 days
  // After 3rd, use formula: prev_interval * ease_factor
};
export const WORDS_PER_REVIEW_SESSION = 20; // Max words to load in a learning session if many are due

export const SRS_MASTERED_REPETITIONS = 5;
export const SRS_MASTERED_INTERVAL_DAYS = 60; // Approx 2 months

// App Settings Constants
export const LOCAL_STORAGE_APP_SETTINGS_KEY = 'foreignWordsAppSettings';

export const DEFAULT_TEXT_PROVIDER_CONFIG: AIProviderConfig = {
  provider: 'gemini', // Default to Gemini
  modelName: 'gemini-2.5-flash-preview-04-17', // Default Gemini text model
};

export const DEFAULT_IMAGE_PROVIDER_CONFIG: AIProviderConfig = {
  provider: 'gemini', // Default to Gemini
  modelName: 'imagen-3.0-generate-002', // Default Gemini image model
};