/**
 * Service de gestion du temps d'étude quotidien
 * Chaque journée a ses propres compteurs indépendants
 */

import { StudySession } from '@/types/Timer';
import { Subject } from '@/types/Subject';
import { dataService } from './dataService';

export interface DailyTimeStats {
  date: Date;
  subjectId: string;
  totalTimeSpent: number; // en secondes pour cette journée
  sessions: StudySession[];
  dailyGoal?: number; // objectif quotidien en minutes
}

export interface SubjectDailyProgress {
  subject: Subject;
  todayTimeSpent: number; // en secondes
  todayGoal: number; // en minutes 
  todayProgress: number; // pourcentage (0-100)
  isCompletedToday: boolean;
  todaySessions: StudySession[];
}

class DailyTimeService {
  private listeners: Set<() => void> = new Set();

  // Système de notification pour les changements
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Erreur dans listener dailyTimeService:', error);
      }
    });
  }

  /**
   * Obtenir le temps étudié pour une matière et une date spécifique
   */
  async getTimeSpentForDate(subjectId: string, date: Date): Promise<number> {
    const sessions = await dataService.getStudySessions();
    const targetDate = this.normalizeDate(date);
    
    console.log(`🔍 [DailyTimeService] Recherche sessions pour ${subjectId} le ${targetDate.toDateString()}`);
    
    const dailySessions = sessions.filter(session => {
      if (session.subjectId !== subjectId) return false;
      if (!session.completed) return false;
      if (!session.endTime) return false;
      
      // 🔧 CORRECTION: S'assurer que session.endTime est bien une Date
      const sessionEndTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime);
      const sessionDate = this.normalizeDate(sessionEndTime);
      const matches = sessionDate.getTime() === targetDate.getTime();
      
      if (matches) {
        console.log(`✅ [DailyTimeService] Session trouvée:`, {
          sessionId: session.id,
          sessionEndTime: sessionEndTime.toLocaleString(),
          sessionDate: sessionDate.toDateString(),
          targetDate: targetDate.toDateString(),
          duration: Math.round(session.duration / 60) + 'min'
        });
      }
      
      return matches;
    });

    const totalSeconds = dailySessions.reduce((total, session) => total + session.duration, 0);
    
    console.log(`📊 [DailyTimeService] Temps pour ${subjectId} le ${date.toDateString()}:`, {
      sessionsFound: dailySessions.length,
      totalMinutes: Math.round(totalSeconds / 60),
      sessions: dailySessions.map(s => ({
        duration: Math.round(s.duration / 60) + 'min',
        endTime: s.endTime
      }))
    });
    
    return totalSeconds;
  }

  /**
   * Obtenir les statistiques quotidiennes pour une matière
   */
  async getDailyStats(subjectId: string, date: Date): Promise<DailyTimeStats> {
    const sessions = await dataService.getStudySessions();
    const targetDate = this.normalizeDate(date);
    
    const dailySessions = sessions.filter(session => {
      if (session.subjectId !== subjectId) return false;
      if (!session.completed) return false;
      if (!session.endTime) return false;
      
      // 🔧 CORRECTION: S'assurer que session.endTime est bien une Date
      const sessionEndTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime);
      const sessionDate = this.normalizeDate(sessionEndTime);
      return sessionDate.getTime() === targetDate.getTime();
    });

    const totalTimeSpent = dailySessions.reduce((total, session) => total + session.duration, 0);

    return {
      date: targetDate,
      subjectId,
      totalTimeSpent,
      sessions: dailySessions,
      dailyGoal: undefined // À calculer selon l'objectif hebdomadaire
    };
  }

  /**
   * Obtenir la progression quotidienne pour une matière
   */
  async getSubjectDailyProgress(subjectId: string, date: Date = new Date()): Promise<SubjectDailyProgress | null> {
    const subject = await dataService.getSubject(subjectId);
    if (!subject) return null;

    const dailyStats = await this.getDailyStats(subjectId, date);
    
    // Calculer l'objectif quotidien basé sur l'objectif hebdomadaire
    const weeklyGoalMinutes = subject.weeklyTimeGoal || 240; // 4h par défaut
    const studyDaysCount = subject.studyDays?.length || 3; // 3 jours par défaut
    const dailyGoalMinutes = Math.round(weeklyGoalMinutes / studyDaysCount);
    
    const todayTimeSpentSeconds = dailyStats.totalTimeSpent;
    const todayTimeSpentMinutes = Math.round(todayTimeSpentSeconds / 60);
    const todayProgress = dailyGoalMinutes > 0 ? (todayTimeSpentMinutes / dailyGoalMinutes) * 100 : 0;
    
    console.log(`🎯 [DailyTimeService] Progression quotidienne ${subject.name}:`, {
      date: date.toDateString(),
      todayTimeSpentMinutes,
      dailyGoalMinutes,
      todayProgress: Math.round(todayProgress) + '%',
      studyDaysCount
    });

    return {
      subject,
      todayTimeSpent: todayTimeSpentSeconds,
      todayGoal: dailyGoalMinutes,
      todayProgress,
      isCompletedToday: todayProgress >= 100,
      todaySessions: dailyStats.sessions
    };
  }

  /**
   * Obtenir les progressions quotidiennes pour toutes les matières
   */
  async getAllDailyProgress(date: Date = new Date()): Promise<SubjectDailyProgress[]> {
    const subjects = await dataService.getSubjects();
    const progressPromises = subjects.map(subject => 
      this.getSubjectDailyProgress(subject.id, date)
    );
    const progressResults = await Promise.all(progressPromises);
    
    return progressResults.filter(Boolean) as SubjectDailyProgress[];
  }

  /**
   * Ajouter du temps d'étude pour une journée spécifique
   * (utilisé par les timers et ajouts manuels)
   */
  async addTimeForDay(subjectId: string, duration: number, date: Date = new Date()): Promise<boolean> {
    console.log(`🔄 [DailyTimeService] Ajout ${duration}s pour ${subjectId} le ${date.toDateString()}`);
    
    try {
      // Créer une session d'étude pour cette journée
      const endTime = new Date();
      // Assurer que endTime est dans la bonne journée
      endTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      
      const session: Omit<StudySession, 'id'> = {
        subjectId: subjectId,
        duration: duration,
        startTime: new Date(endTime.getTime() - duration * 1000),
        endTime: endTime,
        completed: true,
        timerType: 'MANUAL_ENTRY',
        notes: `Ajout manuel pour ${date.toDateString()}`
      };
      
      const savedSession = await dataService.saveStudySession(session);
      console.log(`✅ [DailyTimeService] Session quotidienne sauvegardée:`, {
        id: savedSession.id,
        subjectId: savedSession.subjectId,
        duration: `${Math.round(savedSession.duration/60)}min`,
        endTime: savedSession.endTime?.toLocaleString(),
        date: date.toDateString()
      });
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ [DailyTimeService] Erreur ajout temps quotidien:', error);
      return false;
    }
  }

  /**
   * Réinitialiser le temps pour une journée spécifique
   */
  async resetTimeForDay(subjectId: string, date: Date = new Date()): Promise<boolean> {
    console.log(`🔄 [DailyTimeService] Réinitialisation ${subjectId} pour ${date.toDateString()}`);
    
    try {
      const sessions = await dataService.getStudySessions();
      const targetDate = this.normalizeDate(date);
      
      // Filtrer pour supprimer les sessions de cette journée
      const remainingSessions = sessions.filter(session => {
        if (session.subjectId !== subjectId) return true;
        if (!session.endTime) return true;
        
        // 🔧 CORRECTION: S'assurer que session.endTime est bien une Date
        const sessionEndTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime);
        const sessionDate = this.normalizeDate(sessionEndTime);
        const shouldKeep = sessionDate.getTime() !== targetDate.getTime();
        
        if (!shouldKeep) {
          console.log(`🗑️ [DailyTimeService] Suppression session:`, {
            sessionId: session.id,
            duration: Math.round(session.duration / 60) + 'min',
            endTime: sessionEndTime.toLocaleString()
          });
        }
        
        return shouldKeep;
      });
      
      // Mettre à jour la liste des sessions
      const success = await dataService.updateStudySessions(remainingSessions);
      
      if (success) {
        console.log(`✅ [DailyTimeService] ${sessions.length - remainingSessions.length} sessions supprimées`);
        this.notifyListeners();
        return true;
      } else {
        throw new Error('Échec mise à jour sessions');
      }
    } catch (error) {
      console.error('❌ [DailyTimeService] Erreur réinitialisation quotidienne:', error);
      return false;
    }
  }

  /**
   * Calculer le temps total cumulé pour toutes les dates (pour les vues globales)
   */
  async getTotalTimeSpent(subjectId: string): Promise<number> {
    const sessions = await dataService.getStudySessions();
    const subjectSessions = sessions.filter(s => 
      s.subjectId === subjectId && s.completed
    );
    
    return subjectSessions.reduce((total, session) => total + session.duration, 0);
  }

  /**
   * Obtenir les statistiques hebdomadaires
   */
  async getWeeklyStats(date: Date = new Date()): Promise<{
    totalTimeSpent: number;
    dailyStats: Array<{ date: Date; timeSpent: number }>;
  }> {
    const weekStart = this.getWeekStart(date);
    const dailyStats: Array<{ date: Date; timeSpent: number }> = [];
    let totalTimeSpent = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      
      const subjects = await dataService.getSubjects();
      let dayTotal = 0;
      
      for (const subject of subjects) {
        const dayTime = await this.getTimeSpentForDate(subject.id, currentDate);
        dayTotal += dayTime;
      }
      
      dailyStats.push({ date: currentDate, timeSpent: dayTotal });
      totalTimeSpent += dayTotal;
    }

    return { totalTimeSpent, dailyStats };
  }

  /**
   * Utilitaire : normaliser une date (enlever heure/minute/seconde)
   */
  private normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Utilitaire : obtenir le début de semaine
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
    return new Date(d.setDate(diff));
  }
}

export const dailyTimeService = new DailyTimeService();