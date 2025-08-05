/**
 * Service de persistance des données - Migration des repositories JSON
 */

import localforage from 'localforage';
import { Subject, CreateSubjectDto, UpdateSubjectDto } from '@/types/Subject';
import { TimerModel, CreateTimerDto, StudySession } from '@/types/Timer';
import { StudyDeck, CreateStudyDeckDto } from '@/types/StudyDeck';
import { AppSettings } from '@/types';
import { STORAGE_KEYS, POMODORO_CONFIG } from '@/utils/constants';

// Configuration de localforage
localforage.config({
  name: 'OnyxApp',
  version: 1.0,
  storeName: 'onyx_data',
  description: 'Données de l\'application Onyx'
});

class DataService {
  // Subjects
  async getSubjects(): Promise<Subject[]> {
    try {
      const subjects = await localforage.getItem<Subject[]>(STORAGE_KEYS.SUBJECTS);
      return subjects || [];
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
      return [];
    }
  }

  async getSubject(id: string): Promise<Subject | null> {
    const subjects = await this.getSubjects();
    return subjects.find(s => s.id === id) || null;
  }

  async saveSubject(subjectData: CreateSubjectDto): Promise<Subject> {
    const subjects = await this.getSubjects();
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: subjectData.name,
      status: 'NOT_STARTED',
      targetTime: subjectData.targetTime * 60, // conversion minutes -> secondes
      timeSpent: 0,
      defaultTimerDuration: (subjectData.defaultTimerDuration || 25) * 60,
      createdAt: new Date(),
      updatedAt: new Date(),
      weeklyTimeGoal: subjectData.weeklyTimeGoal || 120, // 2h par défaut
      studyDays: subjectData.studyDays || ['MONDAY', 'WEDNESDAY', 'FRIDAY']
    };

    subjects.push(newSubject);
    await localforage.setItem(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject;
  }

  async updateSubject(id: string, updates: UpdateSubjectDto): Promise<Subject | null> {
    const subjects = await this.getSubjects();
    const index = subjects.findIndex(s => s.id === id);
    
    if (index === -1) return null;

    const updatedSubject: Subject = {
      ...subjects[index],
      ...updates,
      updatedAt: new Date()
    };

    // Conversion minutes -> secondes si nécessaire
    if (updates.targetTime !== undefined) {
      updatedSubject.targetTime = updates.targetTime * 60;
    }
    if (updates.defaultTimerDuration !== undefined) {
      updatedSubject.defaultTimerDuration = updates.defaultTimerDuration * 60;
    }

    subjects[index] = updatedSubject;
    await localforage.setItem(STORAGE_KEYS.SUBJECTS, subjects);
    return updatedSubject;
  }

  async deleteSubject(id: string): Promise<boolean> {
    try {
      const subjects = await this.getSubjects();
      const filteredSubjects = subjects.filter(s => s.id !== id);
      await localforage.setItem(STORAGE_KEYS.SUBJECTS, filteredSubjects);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la matière:', error);
      return false;
    }
  }

  async addTimeToSubject(subjectId: string, duration: number): Promise<Subject | null> {
    const subject = await this.getSubject(subjectId);
    if (!subject) return null;

    const updatedSubject: Subject = {
      ...subject,
      timeSpent: subject.timeSpent + duration,
      lastStudyDate: new Date(),
      updatedAt: new Date()
    };

    // Mettre à jour le statut si l'objectif est atteint
    if (updatedSubject.timeSpent >= updatedSubject.targetTime) {
      updatedSubject.status = 'COMPLETED';
    } else if (updatedSubject.status === 'NOT_STARTED') {
      updatedSubject.status = 'IN_PROGRESS';
    }

    return await this.updateSubject(subjectId, updatedSubject);
  }

  // Timers
  async getTimers(): Promise<TimerModel[]> {
    try {
      const timers = await localforage.getItem<TimerModel[]>(STORAGE_KEYS.TIMERS);
      return timers || [];
    } catch (error) {
      console.error('Erreur lors du chargement des timers:', error);
      return [];
    }
  }

  async saveTimer(timerData: CreateTimerDto): Promise<TimerModel> {
    const timers = await this.getTimers();
    const linkedSubject = timerData.linkedSubjectId 
      ? await this.getSubject(timerData.linkedSubjectId)
      : undefined;

    const newTimer: TimerModel = {
      id: crypto.randomUUID(),
      hours: timerData.hours,
      minutes: timerData.minutes,
      seconds: timerData.seconds,
      initHours: timerData.hours,
      initMinutes: timerData.minutes,
      initSeconds: timerData.seconds,
      timerType: timerData.timerType,
      linkedSubject: linkedSubject || undefined,
      state: 'idle',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    timers.push(newTimer);
    await localforage.setItem(STORAGE_KEYS.TIMERS, timers);
    return newTimer;
  }

  async deleteTimer(id: string): Promise<boolean> {
    try {
      const timers = await this.getTimers();
      const filteredTimers = timers.filter(t => t.id !== id);
      await localforage.setItem(STORAGE_KEYS.TIMERS, filteredTimers);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du timer:', error);
      return false;
    }
  }

  // Study Sessions
  async getStudySessions(): Promise<StudySession[]> {
    try {
      const sessions = await localforage.getItem<StudySession[]>(STORAGE_KEYS.STUDY_SESSIONS);
      return sessions || [];
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      return [];
    }
  }

  async saveStudySession(session: Omit<StudySession, 'id'>): Promise<StudySession> {
    const sessions = await this.getStudySessions();
    const newSession: StudySession = {
      ...session,
      id: crypto.randomUUID()
    };

    sessions.push(newSession);
    await localforage.setItem(STORAGE_KEYS.STUDY_SESSIONS, sessions);
    return newSession;
  }

  // Study Decks
  async getStudyDecks(): Promise<StudyDeck[]> {
    try {
      const decks = await localforage.getItem<StudyDeck[]>(STORAGE_KEYS.STUDY_DECKS);
      return decks || [];
    } catch (error) {
      console.error('Erreur lors du chargement des decks:', error);
      return [];
    }
  }

  async getDefaultStudyDeck(): Promise<StudyDeck> {
    const decks = await this.getStudyDecks();
    let defaultDeck = decks.find(d => d.isDefault);
    
    if (!defaultDeck) {
      // Créer un deck par défaut
      defaultDeck = await this.createStudyDeck({
        name: 'Mes Matières',
        description: 'Deck par défaut'
      });
      defaultDeck.isDefault = true;
      await this.saveStudyDeck(defaultDeck);
    }

    return defaultDeck;
  }

  async createStudyDeck(deckData: CreateStudyDeckDto): Promise<StudyDeck> {
    const subjects = deckData.subjects ? 
      await Promise.all(deckData.subjects.map(id => this.getSubject(id))) :
      [];

    const newDeck: StudyDeck = {
      id: crypto.randomUUID(),
      name: deckData.name,
      description: deckData.description,
      subjects: subjects.filter(Boolean) as Subject[],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false
    };

    const decks = await this.getStudyDecks();
    decks.push(newDeck);
    await localforage.setItem(STORAGE_KEYS.STUDY_DECKS, decks);
    return newDeck;
  }

  async saveStudyDeck(deck: StudyDeck): Promise<StudyDeck> {
    const decks = await this.getStudyDecks();
    const index = decks.findIndex(d => d.id === deck.id);
    
    if (index >= 0) {
      decks[index] = { ...deck, updatedAt: new Date() };
    } else {
      decks.push(deck);
    }
    
    await localforage.setItem(STORAGE_KEYS.STUDY_DECKS, decks);
    return deck;
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await localforage.getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
      return settings || this.getDefaultSettings();
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    await localforage.setItem(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }

  private getDefaultSettings(): AppSettings {
    return {
      theme: 'system',
      language: 'fr',
      notifications: {
        enabled: true,
        sound: true,
        desktop: true
      },
      timer: {
        autoStart: false,
        autoBreak: true,
        longBreakInterval: POMODORO_CONFIG.LONG_BREAK_INTERVAL
      },
      storage: {
        autoSave: true,
        backupEnabled: false
      }
    };
  }

  // Import/Export
  async exportData(): Promise<string> {
    const data = {
      subjects: await this.getSubjects(),
      timers: await this.getTimers(),
      studyDecks: await this.getStudyDecks(),
      studySessions: await this.getStudySessions(),
      settings: await this.getSettings(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.subjects) {
        await localforage.setItem(STORAGE_KEYS.SUBJECTS, data.subjects);
      }
      if (data.timers) {
        await localforage.setItem(STORAGE_KEYS.TIMERS, data.timers);
      }
      if (data.studyDecks) {
        await localforage.setItem(STORAGE_KEYS.STUDY_DECKS, data.studyDecks);
      }
      if (data.studySessions) {
        await localforage.setItem(STORAGE_KEYS.STUDY_SESSIONS, data.studySessions);
      }
      if (data.settings) {
        await localforage.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      return false;
    }
  }

  // Utilitaires
  async clearAllData(): Promise<void> {
    await localforage.clear();
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0
        };
      }
    } catch (error) {
      console.error('Impossible d\'obtenir les informations de stockage:', error);
    }
    
    return { used: 0, available: 0 };
  }
}

export const dataService = new DataService();