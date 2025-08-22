/**
 * Service de gestion des matières d'étude
 */

import { Subject, CreateSubjectDto, UpdateSubjectDto, SubjectProgress } from '@/types/Subject';
import { StudySession } from '@/types/Timer';  
import { dataService } from './dataService';
import { formatDuration, calculateProgress } from '@/utils/timeFormat';

class SubjectService {
  
  async getAllSubjects(): Promise<Subject[]> {
    return await dataService.getSubjects();
  }

  async getSubject(id: string): Promise<Subject | null> {
    return await dataService.getSubject(id);
  }

  async createSubject(subjectData: CreateSubjectDto): Promise<Subject> {
    // Validation
    if (!subjectData.name.trim()) {
      throw new Error('Le nom de la matière est requis');
    }
    
    if (subjectData.targetTime <= 0) {
      throw new Error('Le temps objectif doit être supérieur à 0');
    }

    // Vérifier que le nom n'existe pas déjà
    const existingSubjects = await this.getAllSubjects();
    const nameExists = existingSubjects.some(s => 
      s.name.toLowerCase().trim() === subjectData.name.toLowerCase().trim()
    );
    
    if (nameExists) {
      throw new Error('Une matière avec ce nom existe déjà');
    }

    return await dataService.saveSubject(subjectData);
  }

  async updateSubject(id: string, updates: UpdateSubjectDto): Promise<Subject | null> {
    const subject = await this.getSubject(id);
    if (!subject) {
      throw new Error('Matière non trouvée');
    }

    // Validation du nom si modifié
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('Le nom de la matière ne peut pas être vide');
      }

      // Vérifier l'unicité du nom (sauf pour la matière actuelle)
      const existingSubjects = await this.getAllSubjects();
      const nameExists = existingSubjects.some(s => 
        s.id !== id && s.name.toLowerCase().trim() === updates.name!.toLowerCase().trim()
      );
      
      if (nameExists) {
        throw new Error('Une matière avec ce nom existe déjà');
      }
    }

    return await dataService.updateSubject(id, updates);
  }

  async deleteSubject(id: string): Promise<boolean> {
    const subject = await this.getSubject(id);
    if (!subject) {
      throw new Error('Matière non trouvée');
    }

    return await dataService.deleteSubject(id);
  }

  async addStudyTime(subjectId: string, duration: number): Promise<Subject | null> {
    if (duration <= 0) {
      throw new Error('La durée doit être supérieure à 0');
    }

    const updatedSubject = await dataService.addTimeToSubject(subjectId, duration);
    
    if (updatedSubject) {
      // Enregistrer la session d'étude
      const session: Omit<StudySession, 'id'> = {
        subjectId: subjectId,
        duration: duration,
        startTime: new Date(Date.now() - duration * 1000),
        endTime: new Date(),
        completed: true,
        timerType: 'STUDY_SESSION'
      };
      
      await dataService.saveStudySession(session);
    }

    return updatedSubject;
  }

  async getSubjectProgress(id: string): Promise<SubjectProgress | null> {
    const subject = await this.getSubject(id);
    if (!subject) return null;

    const sessions = await dataService.getStudySessions();
    const subjectSessions = sessions.filter(s => s.subjectId === id);

    // Calculer les progrès quotidiens (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyProgress = this.calculateDailyProgress(subjectSessions, thirtyDaysAgo);

    return {
      subject,
      progressPercentage: calculateProgress(subject.timeSpent, subject.targetTime),
      remainingTime: Math.max(0, subject.targetTime - subject.timeSpent),
      isCompleted: subject.status === 'COMPLETED',
      dailyProgress
    };
  }

  async getSubjectsWithProgress(): Promise<SubjectProgress[]> {
    const subjects = await this.getAllSubjects();
    const progressPromises = subjects.map(s => this.getSubjectProgress(s.id));
    const progressResults = await Promise.all(progressPromises);
    
    return progressResults.filter(Boolean) as SubjectProgress[];
  }

  async getSubjectsByStatus(status: Subject['status']): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects.filter(s => s.status === status);
  }

  async getSubjectsStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    totalTimeSpent: number;
    totalTargetTime: number;
    overallProgress: number;
  }> {
    const subjects = await this.getAllSubjects();
    
    const stats = {
      total: subjects.length,
      completed: subjects.filter(s => s.status === 'COMPLETED').length,
      inProgress: subjects.filter(s => s.status === 'IN_PROGRESS').length,
      notStarted: subjects.filter(s => s.status === 'NOT_STARTED').length,
      totalTimeSpent: subjects.reduce((sum, s) => sum + s.timeSpent, 0),
      totalTargetTime: subjects.reduce((sum, s) => sum + s.targetTime, 0),
      overallProgress: 0
    };

    if (stats.totalTargetTime > 0) {
      stats.overallProgress = (stats.totalTimeSpent / stats.totalTargetTime) * 100;
    }

    return stats;
  }

  async searchSubjects(query: string): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    const lowercaseQuery = query.toLowerCase().trim();
    
    if (!lowercaseQuery) return subjects;

    return subjects.filter(subject =>
      subject.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getMostStudiedSubjects(limit = 5): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects
      .filter(s => s.timeSpent > 0)
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, limit);
  }

  async getLeastStudiedSubjects(limit = 5): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects
      .filter(s => s.status !== 'COMPLETED')
      .sort((a, b) => a.timeSpent - b.timeSpent)
      .slice(0, limit);
  }

  async getRecentlyStudiedSubjects(limit = 5): Promise<Subject[]> {
    const subjects = await this.getAllSubjects();
    return subjects
      .filter(s => s.lastStudyDate)
      .sort((a, b) => {
        const dateA = a.lastStudyDate ? new Date(a.lastStudyDate).getTime() : 0;
        const dateB = b.lastStudyDate ? new Date(b.lastStudyDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  // Méthodes utilitaires
  formatSubjectTime(subject: Subject): {
    timeSpent: string;
    targetTime: string;
    remainingTime: string;
    progressPercentage: string;
  } {
    return {
      timeSpent: formatDuration(subject.timeSpent, 'stats'),
      targetTime: formatDuration(subject.targetTime, 'planning'),
      remainingTime: formatDuration(Math.max(0, subject.targetTime - subject.timeSpent), 'planning'),
      progressPercentage: `${Math.round(calculateProgress(subject.timeSpent, subject.targetTime))}%`
    };
  }

  private calculateDailyProgress(sessions: StudySession[], fromDate: Date): Array<{
    date: Date;
    timeSpent: number;
  }> {
    const dailyMap = new Map<string, number>();
    
    sessions.forEach(session => {
      if (!session.endTime || session.endTime < fromDate) return;
      
      const dateKey = session.endTime.toISOString().split('T')[0];
      const currentTime = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, currentTime + session.duration);
    });

    return Array.from(dailyMap.entries()).map(([dateStr, timeSpent]) => ({
      date: new Date(dateStr),
      timeSpent
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Import/Export spécifique aux matières
  async exportSubjects(): Promise<string> {
    const subjects = await this.getAllSubjects();
    const sessions = await dataService.getStudySessions();
    
    const exportData = {
      subjects,
      sessions,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importSubjects(jsonData: string, replaceExisting = false): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;
      let skipped = 0;

      if (!data.subjects || !Array.isArray(data.subjects)) {
        throw new Error('Format de données invalide');
      }

      const existingSubjects = replaceExisting ? [] : await this.getAllSubjects();
      const existingNames = new Set(existingSubjects.map(s => s.name.toLowerCase()));

      for (const subjectData of data.subjects) {
        try {
          if (!replaceExisting && existingNames.has(subjectData.name?.toLowerCase())) {
            skipped++;
            continue;
          }

          await this.createSubject({
            name: subjectData.name,
            targetTime: Math.round(subjectData.targetTime / 60), // conversion secondes -> minutes
            defaultTimerDuration: Math.round((subjectData.defaultTimerDuration || 1500) / 60)
          });
          
          imported++;
        } catch (error) {
          errors.push(`Erreur pour "${subjectData.name}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      throw new Error(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

export const subjectService = new SubjectService();