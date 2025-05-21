export interface MeaningDefinition {
  translation_ru: string;
  example_en: string; // Example of the foreign word in this specific meaning
}

export interface PartOfSpeechMeaning {
  partOfSpeech: string; // e.g., "noun", "verb"
  definitions: MeaningDefinition[];
}

export interface LinguisticDetails {
  phonetic: string | null; // IPA transcription
  meanings: PartOfSpeechMeaning[];
  synonyms_en: string[];
  antonyms_en: string[];
}

export interface EtymologyInfo {
    origin: string; // Text describing the word's origin and history
}

export interface VerbForms {
  base: string | null;
  thirdPersonSingular: string | null; // (he/she/it walks)
  presentParticiple: string | null;  // (walking)
  pastSimple: string | null;         // (walked)
  pastParticiple: string | null;     // (walked)
}

export interface TenseExample {
  tenseName: string; // e.g., "Present Simple", "Past Perfect Continuous"
  exampleSentence: string;
}


export interface WordPair {
  id: string;
  foreignWord: string;
  russianTranslation: string; // This will be the primary translation
  phoneticTranscription: string | null;
  personalNote?: string; // User's custom note or example
  // SRS Fields
  srsDueDate: string; // YYYY-MM-DD, date for next review
  srsIntervalDays: number; // Current interval in days
  srsEaseFactor: number; // Ease factor, typically starts around 2.5
  srsRepetitions: number; // Number of consecutive correct reviews
  lastReviewedDate: string | null; // YYYY-MM-DD
  srsMasteryLevel: number; // Word Experience Points (Exp)
}

export enum AppMode {
  MANAGE_WORDS = 'MANAGE_WORDS',
  LEARN = 'LEARN',
  WORD_HUNTING = 'WORD_HUNTING',
  HARDCORE_LEARN = 'HARDCORE_LEARN',
  SETTINGS = 'SETTINGS', // New mode for AI provider settings
}

export enum LearningGameMode {
  CLASSIC_QUIZ = 'CLASSIC_QUIZ',
  MATCH_MEANING = 'MATCH_MEANING', // Given Foreign, Choose Russian Meaning
  MATCH_FOREIGN_FROM_RUSSIAN = 'MATCH_FOREIGN_FROM_RUSSIAN', // Given Russian, Choose Foreign Word
}

export interface GamificationData {
  currentStreak: number;
  lastCompletionDate: string | null; // YYYY-MM-DD
  completedDates: string[]; // Array of YYYY-MM-DD strings
}

export interface HuntedWordPreview {
  id: string; // Temporary ID for UI key
  foreignWord: string;
  russianTranslation: string;
  isLoadingDetails?: boolean;
  isAdded?: boolean;
  errorAdding?: string | null;
}

// AI Provider Configuration Types
export type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'localai' | 'none';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string; // Not for Gemini (uses process.env). For OpenAI, OpenRouter.
  modelName?: string; // Specific model identifier.
  baseUrl?: string;   // For LocalAI (e.g., http://localhost:8080/v1).
}

export interface AppSettings {
  textProviderConfig: AIProviderConfig;
  imageProviderConfig: AIProviderConfig;
  // Future settings can be added here
}