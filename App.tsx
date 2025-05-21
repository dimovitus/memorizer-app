

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WordPair, AppMode, GamificationData, LearningGameMode, AppSettings, AIProviderConfig } from './types';
import { 
  LOCAL_STORAGE_WORDS_KEY, 
  GAMIFICATION_DATA_KEY, 
  GAMIFICATION_DAILY_GOAL,
  SRS_INITIAL_EASE_FACTOR,
  SRS_MIN_EASE_FACTOR,
  SRS_EASE_PENALTY_ON_WRONG,
  SRS_CORRECT_STREAK_INTERVALS,
  WORDS_PER_REVIEW_SESSION,
  LOCAL_STORAGE_APP_SETTINGS_KEY,
  DEFAULT_TEXT_PROVIDER_CONFIG,
  DEFAULT_IMAGE_PROVIDER_CONFIG,
} from './constants';
import { getYYYYMMDD, getYesterdayYYYYMMDD, isYesterday } from './utils/dateUtils';
import Navbar from './components/Navbar';
import WordInputForm from './components/WordInputForm';
import WordList from './components/WordList';
import QuizCard from './components/QuizCard';
import ProgressDisplay from './components/ProgressDisplay';
import MatchMeaningGame from './components/MatchMeaningGame';
import MatchForeignFromRussianGame from './components/MatchForeignFromRussianGame';
import WordHuntingMode from './components/WordHuntingMode';
import DeepDiveModal from './components/DeepDiveModal';
import HardcoreLearningSession from './components/HardcoreLearningSession';
import SettingsScreen from './components/SettingsScreen'; // New Settings Screen
import { FileDownloadIcon, FileUploadIcon } from './components/icons';

const App: React.FC = () => {
  const [words, setWords] = useState<WordPair[]>([]);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.MANAGE_WORDS);
  const [learningGameMode, setLearningGameMode] = useState<LearningGameMode>(LearningGameMode.CLASSIC_QUIZ);
  const [reviewWords, setReviewWords] = useState<WordPair[]>([]);

  const [gamificationData, setGamificationData] = useState<GamificationData>({
    currentStreak: 0,
    lastCompletionDate: null,
    completedDates: [],
  });
  const [wordsCorrectedTodayCount, setWordsCorrectedTodayCount] = useState(0);
  const [isDailyGoalMetForSession, setIsDailyGoalMetForSession] = useState(false);
  const [sessionReviewedWordIds, setSessionReviewedWordIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedWordForDeepDive, setSelectedWordForDeepDive] = useState<WordPair | null>(null);
  const [isDeepDiveModalOpen, setIsDeepDiveModalOpen] = useState(false);

  const [currentHardcoreWord, setCurrentHardcoreWord] = useState<WordPair | null>(null);
  const [hardcoreSessionKey, setHardcoreSessionKey] = useState<number>(0);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    textProviderConfig: { ...DEFAULT_TEXT_PROVIDER_CONFIG },
    imageProviderConfig: { ...DEFAULT_IMAGE_PROVIDER_CONFIG },
  });

  // Load words from localStorage
  useEffect(() => {
    try {
      const storedWords = localStorage.getItem(LOCAL_STORAGE_WORDS_KEY);
      if (storedWords) {
        const parsedWords: WordPair[] = JSON.parse(storedWords);
        const todayStr = getYYYYMMDD(new Date());
        const wordsWithDefaults = parsedWords.map(word => ({
          ...word,
          personalNote: word.personalNote || '', 
          srsDueDate: word.srsDueDate || todayStr,
          srsIntervalDays: word.srsIntervalDays === undefined ? 0 : word.srsIntervalDays,
          srsEaseFactor: word.srsEaseFactor || SRS_INITIAL_EASE_FACTOR,
          srsRepetitions: word.srsRepetitions === undefined ? 0 : word.srsRepetitions,
          lastReviewedDate: word.lastReviewedDate || null,
          srsMasteryLevel: word.srsMasteryLevel === undefined ? 0 : word.srsMasteryLevel,
        }));
        setWords(wordsWithDefaults);
      }
    } catch (error) {
      console.error("Не удалось загрузить слова из localStorage:", error);
    }
  }, []);

  // Save words to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_WORDS_KEY, JSON.stringify(words));
    } catch (error) {
      console.error("Не удалось сохранить слова в localStorage:", error);
    }
  }, [words]);

  // Load gamification data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem(GAMIFICATION_DATA_KEY);
    let loadedData: GamificationData;
    if (storedData) {
      loadedData = JSON.parse(storedData);
    } else {
      loadedData = { currentStreak: 0, lastCompletionDate: null, completedDates: [] };
    }

    const todayStr = getYYYYMMDD(new Date());
    const yesterdayStr = getYesterdayYYYYMMDD(new Date());

    if (loadedData.lastCompletionDate &&
        loadedData.lastCompletionDate !== todayStr &&
        loadedData.lastCompletionDate !== yesterdayStr) {
      loadedData.currentStreak = 0;
    }
    
    setGamificationData(loadedData);

    if (loadedData.completedDates.includes(todayStr)) {
      setWordsCorrectedTodayCount(GAMIFICATION_DAILY_GOAL); 
      setIsDailyGoalMetForSession(true);
    } else {
      setWordsCorrectedTodayCount(0);
      setIsDailyGoalMetForSession(false);
    }
  }, []);

  // Save gamification data to localStorage
  useEffect(() => {
    localStorage.setItem(GAMIFICATION_DATA_KEY, JSON.stringify(gamificationData));
  }, [gamificationData]);

  // Load app settings from localStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_APP_SETTINGS_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Basic validation to ensure structure is somewhat correct before setting
        if (parsedSettings && parsedSettings.textProviderConfig && parsedSettings.imageProviderConfig) {
          setAppSettings(parsedSettings);
        } else {
          // If structure is broken, reset to defaults
          setAppSettings({
            textProviderConfig: { ...DEFAULT_TEXT_PROVIDER_CONFIG },
            imageProviderConfig: { ...DEFAULT_IMAGE_PROVIDER_CONFIG },
          });
        }
      } else {
         setAppSettings({
            textProviderConfig: { ...DEFAULT_TEXT_PROVIDER_CONFIG },
            imageProviderConfig: { ...DEFAULT_IMAGE_PROVIDER_CONFIG },
          });
      }
    } catch (error) {
      console.error("Не удалось загрузить настройки приложения из localStorage:", error);
      setAppSettings({ // Fallback to defaults on error
        textProviderConfig: { ...DEFAULT_TEXT_PROVIDER_CONFIG },
        imageProviderConfig: { ...DEFAULT_IMAGE_PROVIDER_CONFIG },
      });
    }
  }, []);

  // Save app settings to localStorage
  const handleUpdateAppSettings = useCallback((newSettings: AppSettings) => {
    setAppSettings(newSettings);
    try {
      localStorage.setItem(LOCAL_STORAGE_APP_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Не удалось сохранить настройки приложения в localStorage:", error);
    }
  }, []);


  const addWord = useCallback((foreignWord: string, russianTranslation: string, phoneticTranscription: string | null, personalNote?: string) => {
    const todayStr = getYYYYMMDD(new Date());
    if (words.some(w => w.foreignWord.trim().toLowerCase() === foreignWord.trim().toLowerCase())) {
        alert(`Слово "${foreignWord}" уже существует в вашем списке.`);
        return false; 
    }
    const newWord: WordPair = {
      id: crypto.randomUUID(),
      foreignWord: foreignWord.trim(),
      russianTranslation: russianTranslation.trim(),
      phoneticTranscription,
      personalNote: personalNote || '',
      srsDueDate: todayStr, 
      srsIntervalDays: 0,
      srsEaseFactor: SRS_INITIAL_EASE_FACTOR,
      srsRepetitions: 0,
      lastReviewedDate: null,
      srsMasteryLevel: 0,
    };
    setWords((prevWords) => [newWord, ...prevWords].sort((a, b) => a.foreignWord.localeCompare(b.foreignWord)));
    return true;
  }, [words]);

  const deleteWord = useCallback((id: string) => {
    setWords((prevWords) => prevWords.filter((word) => word.id !== id));
  }, []);

  const handleOpenDeepDiveModal = useCallback((word: WordPair) => {
    setSelectedWordForDeepDive(word);
    setIsDeepDiveModalOpen(true);
  }, []);

  const handleCloseDeepDiveModal = useCallback(() => {
    setIsDeepDiveModalOpen(false);
    setSelectedWordForDeepDive(null);
  }, []);

  const handleUpdateWordNoteInDeepDive = useCallback((wordId: string, newNote: string) => {
    setWords(prevWords => 
      prevWords.map(w => w.id === wordId ? { ...w, personalNote: newNote } : w)
    );
    if (currentHardcoreWord && currentHardcoreWord.id === wordId) {
      setCurrentHardcoreWord(prev => prev ? {...prev, personalNote: newNote} : null);
    }
     if (selectedWordForDeepDive && selectedWordForDeepDive.id === wordId) {
      setSelectedWordForDeepDive(prev => prev ? {...prev, personalNote: newNote} : null);
    }
  }, [currentHardcoreWord, selectedWordForDeepDive]);


  const handleImportWords = useCallback((importedWordsFromFile: WordPair[]) => {
    const todayStr = getYYYYMMDD(new Date());
    let newWordsCount = 0;
    let skippedCount = 0;

    const updatedWords = [...words];
    const existingForeignWords = new Set(words.map(w => w.foreignWord.toLowerCase()));

    for (const importedWord of importedWordsFromFile) {
        if (existingForeignWords.has(importedWord.foreignWord.toLowerCase())) {
            skippedCount++;
            continue;
        }
        
        const newWordFull: WordPair = {
            id: importedWord.id || crypto.randomUUID(),
            foreignWord: importedWord.foreignWord,
            russianTranslation: importedWord.russianTranslation,
            phoneticTranscription: importedWord.phoneticTranscription || null,
            personalNote: importedWord.personalNote || '',
            srsDueDate: importedWord.srsDueDate || todayStr,
            srsIntervalDays: importedWord.srsIntervalDays === undefined ? 0 : importedWord.srsIntervalDays,
            srsEaseFactor: importedWord.srsEaseFactor || SRS_INITIAL_EASE_FACTOR,
            srsRepetitions: importedWord.srsRepetitions === undefined ? 0 : importedWord.srsRepetitions,
            lastReviewedDate: importedWord.lastReviewedDate || null,
            srsMasteryLevel: importedWord.srsMasteryLevel === undefined ? 0 : importedWord.srsMasteryLevel,
        };
        updatedWords.push(newWordFull);
        existingForeignWords.add(newWordFull.foreignWord.toLowerCase());
        newWordsCount++;
    }
    setWords(updatedWords.sort((a, b) => a.foreignWord.localeCompare(b.foreignWord)));
    alert(`Импорт завершен. Добавлено: ${newWordsCount} слов. Пропущено (дубликаты): ${skippedCount} слов.`);
  }, [words]);
  
  const handleExportWords = () => {
    try {
      const jsonString = JSON.stringify(words, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `memorizer_word_bank_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("Банк слов успешно экспортирован!");
    } catch (error) {
      console.error("Ошибка экспорта слов:", error);
      alert("Не удалось экспортировать слова.");
    }
  };

  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const importedData = JSON.parse(json);
          if (Array.isArray(importedData) && importedData.every(item => typeof item.foreignWord === 'string' && typeof item.russianTranslation === 'string')) {
            handleImportWords(importedData as WordPair[]);
          } else {
            alert("Ошибка: Файл имеет неверный формат. Ожидается массив объектов WordPair.");
          }
        } catch (error) {
          console.error("Ошибка импорта файла:", error);
          alert(`Не удалось импортировать файл: ${error instanceof Error ? error.message : "Неверный JSON"}`);
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) { 
        fileInputRef.current.value = "";
      }
    }
  };


  const handleWordReviewed = useCallback((wordId: string, isCorrect: boolean) => {
    const todayStr = getYYYYMMDD(new Date());
    setWords(prevWords => 
      prevWords.map(word => {
        if (word.id === wordId) {
          let { srsRepetitions, srsIntervalDays, srsEaseFactor, srsMasteryLevel } = word;
          let newDueDate: Date;

          if (isCorrect) {
            srsRepetitions += 1;
            srsMasteryLevel = (srsMasteryLevel || 0) + 1; 
            if (srsRepetitions === 1) {
              srsIntervalDays = SRS_CORRECT_STREAK_INTERVALS[1];
            } else if (srsRepetitions === 2) {
              srsIntervalDays = SRS_CORRECT_STREAK_INTERVALS[2];
            } else {
              srsIntervalDays = Math.max(1, Math.round(srsIntervalDays * srsEaseFactor));
            }
          } else {
            srsRepetitions = 0;
            srsIntervalDays = 1; 
            srsEaseFactor = Math.max(SRS_MIN_EASE_FACTOR, srsEaseFactor - SRS_EASE_PENALTY_ON_WRONG);
          }
          
          newDueDate = new Date();
          newDueDate.setDate(newDueDate.getDate() + srsIntervalDays);

          return {
            ...word,
            srsRepetitions,
            srsIntervalDays,
            srsEaseFactor,
            srsDueDate: getYYYYMMDD(newDueDate),
            lastReviewedDate: todayStr,
            srsMasteryLevel,
          };
        }
        return word;
      })
    );

    if (isCorrect && !sessionReviewedWordIds.has(wordId)) {
      setSessionReviewedWordIds(prev => new Set(prev).add(wordId)); 
      
      setWordsCorrectedTodayCount(prevCount => {
        const newCount = prevCount + 1; 
        if (newCount >= GAMIFICATION_DAILY_GOAL && !gamificationData.completedDates.includes(todayStr)) {
          setGamificationData(prevData => {
            const updatedCompletedDates = [...new Set([...prevData.completedDates, todayStr])];
            let newStreak = 1;
            if (prevData.lastCompletionDate && isYesterday(prevData.lastCompletionDate, todayStr)) {
              newStreak = prevData.currentStreak + 1;
            } else if (prevData.lastCompletionDate === todayStr) {
              newStreak = prevData.currentStreak;
            }
            return {
              currentStreak: newStreak,
              lastCompletionDate: todayStr,
              completedDates: updatedCompletedDates,
            };
          });
          setIsDailyGoalMetForSession(true);
        }
        return newCount;
      });
    }
  }, [gamificationData.completedDates, gamificationData.currentStreak, gamificationData.lastCompletionDate, sessionReviewedWordIds]);

  const getWordsForReviewSession = useCallback((): WordPair[] => {
    const todayStr = getYYYYMMDD(new Date());
    
    const dueWords = words
      .filter(word => word.srsDueDate <= todayStr)
      .sort((a, b) => {
        if (a.srsDueDate < b.srsDueDate) return -1;
        if (a.srsDueDate > b.srsDueDate) return 1;
        if (a.srsRepetitions < b.srsRepetitions) return -1;
        if (a.srsRepetitions > b.srsRepetitions) return 1;
        return 0;
      });

    let sessionList = dueWords;

    if (dueWords.length < WORDS_PER_REVIEW_SESSION) {
      const newWords = words
        .filter(word => !dueWords.find(dw => dw.id === word.id) && word.srsRepetitions <= 1) 
        .sort((a,b) => (a.lastReviewedDate || '').localeCompare(b.lastReviewedDate || '')) 
        .slice(0, WORDS_PER_REVIEW_SESSION - dueWords.length);
      sessionList = [...dueWords, ...newWords];
    }
    
    return sessionList.slice(0, WORDS_PER_REVIEW_SESSION);
  }, [words]);

  const pickNewHardcoreWord = useCallback(() => {
    if (words.length > 0) {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentHardcoreWord(words[randomIndex]);
      setHardcoreSessionKey(prevKey => prevKey + 1); 
    } else {
      setCurrentHardcoreWord(null);
    }
  }, [words]);

  useEffect(() => {
    if (currentMode === AppMode.LEARN || currentMode === AppMode.HARDCORE_LEARN) {
      setSessionReviewedWordIds(new Set()); 
      const todayStr = getYYYYMMDD(new Date());
      if (gamificationData.completedDates.includes(todayStr)) {
        setWordsCorrectedTodayCount(GAMIFICATION_DAILY_GOAL);
        setIsDailyGoalMetForSession(true);
      } else {
        setWordsCorrectedTodayCount(0);
        setIsDailyGoalMetForSession(false);
      }
    }


    if (currentMode === AppMode.LEARN) {
      setReviewWords(getWordsForReviewSession());
    } else if (currentMode === AppMode.HARDCORE_LEARN) {
      pickNewHardcoreWord();
    } else {
      setCurrentHardcoreWord(null); 
    }
  }, [currentMode, getWordsForReviewSession, gamificationData.completedDates, pickNewHardcoreWord]);

  const handleHardcoreSessionComplete = useCallback(() => {
    if (currentHardcoreWord) {
      handleWordReviewed(currentHardcoreWord.id, true); 
    }
    pickNewHardcoreWord(); 
  }, [currentHardcoreWord, handleWordReviewed, pickNewHardcoreWord]);

  const handleExitHardcoreMode = useCallback(() => {
    setCurrentMode(AppMode.MANAGE_WORDS);
  }, []);


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl space-y-6">
        <Navbar currentMode={currentMode} onSetMode={setCurrentMode} wordCount={words.length} />
        
        {(currentMode === AppMode.LEARN || currentMode === AppMode.HARDCORE_LEARN) && (
            <div className="flex justify-center">
                 <ProgressDisplay
                    streak={gamificationData.currentStreak}
                    completedDates={gamificationData.completedDates}
                    dailyGoal={GAMIFICATION_DAILY_GOAL}
                    wordsDueCount={words.filter(w => w.srsDueDate <= getYYYYMMDD(new Date())).length}
                  />
            </div>
        )}

        <main className="w-full">
          {currentMode === AppMode.MANAGE_WORDS && (
            <div className="space-y-6">
              <WordInputForm onAddWord={addWord} />
              <WordList 
                words={words.sort((a,b) => a.foreignWord.localeCompare(b.foreignWord))} 
                onDeleteWord={deleteWord} 
                onDeepDiveWord={handleOpenDeepDiveModal}
              />
              <div className="bg-white p-6 rounded-lg shadow-xl mt-6">
                <h3 className="text-xl font-semibold text-slate-700 mb-4">Управление Банком Слов</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExportWords}
                    disabled={words.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    <FileDownloadIcon className="h-5 w-5" />
                    Экспортировать Слова
                  </button>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportFileSelected} 
                    className="hidden" 
                    ref={fileInputRef} 
                    id="import-file-input-main"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
                  >
                    <FileUploadIcon className="h-5 w-5" />
                    Импортировать Слова
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentMode === AppMode.WORD_HUNTING && (
            <WordHuntingMode 
              onAddWord={addWord} 
              existingWords={words}
            />
          )}
           {currentMode === AppMode.SETTINGS && (
            <SettingsScreen
              currentSettings={appSettings}
              onSaveSettings={handleUpdateAppSettings}
            />
          )}

          {currentMode === AppMode.HARDCORE_LEARN && (
            <HardcoreLearningSession
              key={hardcoreSessionKey} 
              word={currentHardcoreWord}
              onSessionComplete={handleHardcoreSessionComplete}
              onExit={handleExitHardcoreMode}
              onUpdateWordNote={handleUpdateWordNoteInDeepDive}
            />
          )}

          {currentMode === AppMode.LEARN && (
            <div className="flex flex-col items-center space-y-6">
              {reviewWords.length === 0 && words.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
                  <h3 className="text-lg font-semibold text-sky-700">Все повторено!</h3>
                  <p className="text-slate-600">Сейчас нет слов для повторения. Добавьте больше слов или зайдите позже!</p>
                </div>
              )}
              {reviewWords.length === 0 && words.length === 0 && (
                 <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
                  <h3 className="text-lg font-semibold text-sky-700">Добавьте Слова!</h3>
                  <p className="text-slate-600">Ваш список слов пуст. Перейдите в "Мои Слова" или "Охота за Словами", чтобы начать добавлять новую лексику.</p>
                </div>
              )}

              {reviewWords.length > 0 && (
                <>
                  <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md">
                    <label htmlFor="learningGameMode" className="block text-sm font-medium text-slate-700 mb-2">Выберите Режим Обучения:</label>
                    <select
                      id="learningGameMode"
                      value={learningGameMode}
                      onChange={(e) => setLearningGameMode(e.target.value as LearningGameMode)}
                      className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value={LearningGameMode.CLASSIC_QUIZ}>Классическая Викторина (Ин. -> Рус.)</option>
                      <option value={LearningGameMode.MATCH_MEANING}>Выберите Перевод (Ин. -> Рус.)</option>
                      <option value={LearningGameMode.MATCH_FOREIGN_FROM_RUSSIAN}>Угадайте Слово (Рус. -> Ин.)</option>
                    </select>
                  </div>

                  {learningGameMode === LearningGameMode.CLASSIC_QUIZ && (
                    <QuizCard
                      words={reviewWords}
                      onWordReviewed={handleWordReviewed}
                      wordsCorrectedTodayForGoal={wordsCorrectedTodayCount}
                      dailyGoal={GAMIFICATION_DAILY_GOAL}
                      isDailyGoalMet={isDailyGoalMetForSession}
                    />
                  )}
                  {learningGameMode === LearningGameMode.MATCH_MEANING && (
                    <MatchMeaningGame
                      words={reviewWords}
                      onWordReviewed={handleWordReviewed}
                      wordsCorrectedTodayForGoal={wordsCorrectedTodayCount}
                      dailyGoal={GAMIFICATION_DAILY_GOAL}
                      isDailyGoalMet={isDailyGoalMetForSession}
                    />
                  )}
                  {learningGameMode === LearningGameMode.MATCH_FOREIGN_FROM_RUSSIAN && (
                    <MatchForeignFromRussianGame
                      words={reviewWords}
                      onWordReviewed={handleWordReviewed}
                      wordsCorrectedTodayForGoal={wordsCorrectedTodayCount}
                      dailyGoal={GAMIFICATION_DAILY_GOAL}
                      isDailyGoalMet={isDailyGoalMetForSession}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
      {isDeepDiveModalOpen && selectedWordForDeepDive && (
        <DeepDiveModal 
          word={selectedWordForDeepDive} 
          onClose={handleCloseDeepDiveModal}
          onUpdateWordNote={handleUpdateWordNoteInDeepDive}
        />
      )}
       <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Меморайзер Слов. SRS, Exp и ИИ-помощник.</p>
      </footer>
    </div>
  );
};

export default App;