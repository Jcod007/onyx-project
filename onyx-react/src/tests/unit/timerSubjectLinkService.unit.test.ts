import { timerSubjectLinkService } from '@/services/timerSubjectLinkService';
import { subjectService } from '@/services/subjectService';
import { ActiveTimer } from '@/types/ActiveTimer';
import { Subject } from '@/types/Subject';

// Mock des services
jest.mock('@/services/subjectService');
jest.mock('@/utils/logger');

const mockSubjectService = subjectService as jest.Mocked<typeof subjectService>;

describe('TimerSubjectLinkService', () => {
  let mockTimerService: {
    getTimers: jest.Mock;
    updateTimer: jest.Mock;
    removeTimer: jest.Mock;
    subscribe: jest.Mock;
  };

  const mockTimer: ActiveTimer = {
    id: 'timer-1',
    title: 'Test Timer',
    config: {
      workDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
      longBreakInterval: 4
    },
    isPomodoroMode: false,
    maxCycles: 1,
    createdAt: new Date(),
    lastUsed: new Date(),
    isEphemeral: false
  };

  const mockSubject: Subject = {
    id: 'subject-1',
    name: 'Test Subject',
    targetTime: 3600,
    status: 'NOT_STARTED',
    createdAt: new Date(),
    defaultTimerDuration: 1500,
    weeklyTimeGoal: 300,
    studyDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    defaultTimerMode: 'quick_timer'
  } as Subject;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Créer un nouveau mock du service de timers pour chaque test
    mockTimerService = {
      getTimers: jest.fn().mockReturnValue([mockTimer]),
      updateTimer: jest.fn().mockResolvedValue(undefined),
      removeTimer: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockReturnValue(() => {})
    };

    // Injecter le mock du service de timers
    timerSubjectLinkService.setTimerService(mockTimerService as any);

    // Setup des mocks par défaut
    mockSubjectService.getSubject.mockResolvedValue(mockSubject);
    mockSubjectService.updateSubject.mockResolvedValue(mockSubject);
    mockSubjectService.getAllSubjects.mockResolvedValue([mockSubject]);
    mockSubjectService.deleteSubject.mockResolvedValue(true);
  });

  describe('linkCourseToTimer', () => {
    it('devrait lier un cours à un timer avec succès', async () => {
      const courseId = 'subject-1';
      const timerId = 'timer-1';

      await timerSubjectLinkService.linkCourseToTimer(courseId, timerId);

      // Vérifier que le cours est mis à jour
      expect(mockSubjectService.updateSubject).toHaveBeenCalledWith(courseId, {
        linkedTimerId: timerId,
        defaultTimerMode: 'simple',
        quickTimerConfig: undefined,
        timerConversionNote: undefined
      });

      // Vérifier que le timer est mis à jour
      expect(mockTimerService.updateTimer).toHaveBeenCalledWith(timerId, {
        linkedSubject: mockSubject,
        lastUsed: expect.any(Date)
      });
    });

    it('devrait lever une erreur si le cours est introuvable', async () => {
      mockSubjectService.getSubject.mockResolvedValue(null);

      await expect(
        timerSubjectLinkService.linkCourseToTimer('inexistant', 'timer-1')
      ).rejects.toThrow('Cours inexistant introuvable');
    });

    it('devrait lever une erreur si le timer est introuvable', async () => {
      mockTimerService.getTimers.mockReturnValue([]);

      await expect(
        timerSubjectLinkService.linkCourseToTimer('subject-1', 'inexistant')
      ).rejects.toThrow('Timer inexistant introuvable');
    });
  });

  describe('unlinkCourse', () => {
    it('devrait délier un cours et convertir en timer rapide', async () => {
      const linkedSubject = {
        ...mockSubject,
        linkedTimerId: 'timer-1'
      };
      const linkedTimer = {
        ...mockTimer,
        linkedSubject: linkedSubject
      };

      mockSubjectService.getSubject.mockResolvedValue(linkedSubject);
      mockTimerService.getTimers.mockReturnValue([linkedTimer]);

      await timerSubjectLinkService.unlinkCourse('subject-1');

      // Vérifier que le cours est mis à jour avec conversion vers timer rapide
      expect(mockSubjectService.updateSubject).toHaveBeenCalledWith('subject-1', {
        linkedTimerId: undefined,
        defaultTimerMode: 'quick_timer',
        quickTimerConfig: {
          type: 'simple',
          workDuration: 25 // 1500 secondes / 60
        },
        timerConversionNote: expect.stringContaining('Timer "Test Timer" délié le')
      });

      // Vérifier que le timer est délié
      expect(mockTimerService.updateTimer).toHaveBeenCalledWith('timer-1', {
        linkedSubject: undefined,
        lastUsed: expect.any(Date)
      });
    });

    it('ne devrait rien faire si le cours n\'a pas de timer lié', async () => {
      const unlinkedSubject = {
        ...mockSubject,
        linkedTimerId: undefined
      };

      mockSubjectService.getSubject.mockResolvedValue(unlinkedSubject);

      await timerSubjectLinkService.unlinkCourse('subject-1');

      // Aucune mise à jour ne devrait être effectuée
      expect(mockSubjectService.updateSubject).not.toHaveBeenCalled();
      expect(mockTimerService.updateTimer).not.toHaveBeenCalled();
    });
  });

  describe('handleTimerDeletion', () => {
    it('devrait supprimer un timer et convertir les cours liés', async () => {
      const linkedSubject = {
        ...mockSubject,
        linkedTimerId: 'timer-1'
      };

      mockSubjectService.getAllSubjects.mockResolvedValue([linkedSubject]);
      mockTimerService.getTimers.mockReturnValue([mockTimer]);

      await timerSubjectLinkService.handleTimerDeletion('timer-1');

      // Vérifier que le cours est converti
      expect(mockSubjectService.updateSubject).toHaveBeenCalledWith('subject-1', {
        linkedTimerId: undefined,
        defaultTimerMode: 'quick_timer',
        quickTimerConfig: {
          type: 'simple',
          workDuration: 25
        },
        timerConversionNote: expect.stringContaining('Timer "Test Timer" supprimé le')
      });

      // Vérifier que le timer est supprimé
      expect(mockTimerService.removeTimer).toHaveBeenCalledWith('timer-1');
    });

    it('devrait supprimer un timer non lié sans conversion', async () => {
      mockSubjectService.getAllSubjects.mockResolvedValue([]);
      mockTimerService.getTimers.mockReturnValue([mockTimer]);

      await timerSubjectLinkService.handleTimerDeletion('timer-1');

      // Aucune conversion ne devrait être effectuée
      expect(mockSubjectService.updateSubject).not.toHaveBeenCalled();

      // Le timer devrait quand même être supprimé
      expect(mockTimerService.removeTimer).toHaveBeenCalledWith('timer-1');
    });
  });

  describe('handleCourseDeletion', () => {
    it('devrait supprimer un cours et délier le timer associé', async () => {
      const linkedSubject = {
        ...mockSubject,
        linkedTimerId: 'timer-1'
      };

      mockSubjectService.getSubject.mockResolvedValue(linkedSubject);

      await timerSubjectLinkService.handleCourseDeletion('subject-1');

      // Vérifier que le timer est délié
      expect(mockTimerService.updateTimer).toHaveBeenCalledWith('timer-1', {
        linkedSubject: undefined,
        lastUsed: expect.any(Date)
      });

      // Vérifier que le cours est supprimé
      expect(mockSubjectService.deleteSubject).toHaveBeenCalledWith('subject-1');
    });
  });

  describe('getAvailableTimersForSubject', () => {
    it('devrait retourner les timers disponibles pour liaison', () => {
      const availableTimer = { ...mockTimer, linkedSubject: undefined };
      const linkedTimer = { 
        ...mockTimer, 
        id: 'timer-2',
        linkedSubject: { id: 'other-subject', name: 'Other Subject' }
      };
      const ephemeralTimer = { 
        ...mockTimer, 
        id: 'timer-3',
        isEphemeral: true 
      };

      mockTimerService.getTimers.mockReturnValue([
        availableTimer,
        linkedTimer,
        ephemeralTimer
      ]);

      const result = timerSubjectLinkService.getAvailableTimersForSubject();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('timer-1');
    });

    it('devrait inclure le timer déjà lié au cours spécifié', () => {
      const subjectLinkedTimer = { 
        ...mockTimer,
        linkedSubject: { id: 'subject-1', name: 'Test Subject' }
      };

      mockTimerService.getTimers.mockReturnValue([subjectLinkedTimer]);

      const result = timerSubjectLinkService.getAvailableTimersForSubject('subject-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('timer-1');
    });
  });

  describe('ensureDataConsistency', () => {
    it('devrait réparer les références orphelines', async () => {
      // Cours avec référence timer invalide
      const orphanedSubject = {
        ...mockSubject,
        linkedTimerId: 'inexistant-timer'
      };

      // Timer avec référence cours invalide
      const orphanedTimer = {
        ...mockTimer,
        linkedSubject: { id: 'inexistant-subject', name: 'Inexistant' }
      };

      mockSubjectService.getAllSubjects.mockResolvedValue([orphanedSubject]);
      mockTimerService.getTimers.mockReturnValue([orphanedTimer]);

      await timerSubjectLinkService.ensureDataConsistency();

      // Vérifier que la référence orpheline du cours est supprimée
      expect(mockSubjectService.updateSubject).toHaveBeenCalledWith('subject-1', {
        linkedTimerId: undefined
      });

      // Vérifier que la référence orpheline du timer est supprimée
      expect(mockTimerService.updateTimer).toHaveBeenCalledWith('timer-1', {
        linkedSubject: undefined
      });
    });

    it('ne devrait rien faire si toutes les données sont cohérentes', async () => {
      const consistentSubject = {
        ...mockSubject,
        linkedTimerId: 'timer-1'
      };
      const consistentTimer = {
        ...mockTimer,
        linkedSubject: consistentSubject
      };

      mockSubjectService.getAllSubjects.mockResolvedValue([consistentSubject]);
      mockTimerService.getTimers.mockReturnValue([consistentTimer]);

      await timerSubjectLinkService.ensureDataConsistency();

      // Aucune réparation ne devrait être effectuée
      expect(mockSubjectService.updateSubject).not.toHaveBeenCalled();
      expect(mockTimerService.updateTimer).not.toHaveBeenCalled();
    });
  });

  describe('getLinkageStatus', () => {
    it('devrait retourner un rapport complet des liaisons', async () => {
      const linkedSubject = {
        ...mockSubject,
        linkedTimerId: 'timer-1'
      };
      const unlinkedSubject = {
        ...mockSubject,
        id: 'subject-2',
        name: 'Unlinked Subject'
      };
      const linkedTimer = {
        ...mockTimer,
        linkedSubject: linkedSubject
      };
      const unlinkedTimer = {
        ...mockTimer,
        id: 'timer-2',
        linkedSubject: undefined
      };

      mockSubjectService.getAllSubjects.mockResolvedValue([linkedSubject, unlinkedSubject]);
      mockTimerService.getTimers.mockReturnValue([linkedTimer, unlinkedTimer]);

      const status = await timerSubjectLinkService.getLinkageStatus();

      expect(status.linkedCourses).toHaveLength(1);
      expect(status.unlinkedCourses).toHaveLength(1);
      expect(status.unlinkedTimers).toHaveLength(1);
      expect(status.orphanedReferences).toHaveLength(0);
    });
  });
});