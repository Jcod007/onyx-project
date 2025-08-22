import { integratedTimerService } from '@/services/integratedTimerService';
import { centralizedTimerService } from '@/services/centralizedTimerService';
import { timerSubjectLinkService } from '@/services/timerSubjectLinkService';
import { ActiveTimer } from '@/types/ActiveTimer';

// Mock des services
jest.mock('@/services/centralizedTimerService');
jest.mock('@/services/timerSubjectLinkService');

const mockCentralizedTimerService = centralizedTimerService as jest.Mocked<typeof centralizedTimerService>;
const mockTimerSubjectLinkService = timerSubjectLinkService as jest.Mocked<typeof timerSubjectLinkService>;

describe('IntegratedTimerService', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gestion des timers', () => {
    it('devrait déléguer getTimers au service centralisé', () => {
      mockCentralizedTimerService.getTimers.mockReturnValue([mockTimer]);

      const result = integratedTimerService.getTimers();

      expect(mockCentralizedTimerService.getTimers).toHaveBeenCalled();
      expect(result).toEqual([mockTimer]);
    });

    it('devrait déléguer addTimer au service centralisé', async () => {
      mockCentralizedTimerService.addTimer.mockResolvedValue(mockTimer);

      const result = await integratedTimerService.addTimer(mockTimer);

      expect(mockCentralizedTimerService.addTimer).toHaveBeenCalledWith(mockTimer);
      expect(result).toEqual(mockTimer);
    });

    it('devrait déléguer updateTimer au service centralisé', async () => {
      const updates = { title: 'Updated Timer' };
      mockCentralizedTimerService.updateTimer.mockResolvedValue(undefined);

      await integratedTimerService.updateTimer('timer-1', updates);

      expect(mockCentralizedTimerService.updateTimer).toHaveBeenCalledWith('timer-1', updates);
    });

    it('devrait utiliser timerSubjectLinkService pour removeTimer', async () => {
      mockTimerSubjectLinkService.handleTimerDeletion.mockResolvedValue(undefined);

      await integratedTimerService.removeTimer('timer-1');

      expect(mockTimerSubjectLinkService.handleTimerDeletion).toHaveBeenCalledWith('timer-1');
    });

    it('devrait déléguer subscribe au service centralisé', () => {
      const mockListener = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockCentralizedTimerService.subscribe.mockReturnValue(mockUnsubscribe);

      const result = integratedTimerService.subscribe(mockListener);

      expect(mockCentralizedTimerService.subscribe).toHaveBeenCalledWith(mockListener);
      expect(result).toBe(mockUnsubscribe);
    });
  });

  describe('Liaisons timer-cours', () => {
    it('devrait déléguer linkCourseToTimer au service de liaison', async () => {
      mockTimerSubjectLinkService.linkCourseToTimer.mockResolvedValue(undefined);

      await integratedTimerService.linkCourseToTimer('course-1', 'timer-1');

      expect(mockTimerSubjectLinkService.linkCourseToTimer).toHaveBeenCalledWith('course-1', 'timer-1');
    });

    it('devrait déléguer unlinkCourse au service de liaison', async () => {
      mockTimerSubjectLinkService.unlinkCourse.mockResolvedValue(undefined);

      await integratedTimerService.unlinkCourse('course-1');

      expect(mockTimerSubjectLinkService.unlinkCourse).toHaveBeenCalledWith('course-1');
    });

    it('devrait déléguer handleCourseDeletion au service de liaison', async () => {
      mockTimerSubjectLinkService.handleCourseDeletion.mockResolvedValue(undefined);

      await integratedTimerService.handleCourseDeletion('course-1');

      expect(mockTimerSubjectLinkService.handleCourseDeletion).toHaveBeenCalledWith('course-1');
    });

    it('devrait déléguer getAvailableTimersForSubject au service de liaison', () => {
      mockTimerSubjectLinkService.getAvailableTimersForSubject.mockReturnValue([mockTimer]);

      const result = integratedTimerService.getAvailableTimersForSubject('subject-1');

      expect(mockTimerSubjectLinkService.getAvailableTimersForSubject).toHaveBeenCalledWith('subject-1');
      expect(result).toEqual([mockTimer]);
    });

    it('devrait déléguer getLinkedTimersForSubject au service de liaison', () => {
      mockTimerSubjectLinkService.getLinkedTimersForSubject.mockReturnValue([mockTimer]);

      const result = integratedTimerService.getLinkedTimersForSubject('subject-1');

      expect(mockTimerSubjectLinkService.getLinkedTimersForSubject).toHaveBeenCalledWith('subject-1');
      expect(result).toEqual([mockTimer]);
    });

    it('devrait déléguer getLinkageStatus au service de liaison', async () => {
      const mockStatus = {
        linkedCourses: [],
        unlinkedCourses: [],
        unlinkedTimers: [],
        orphanedReferences: []
      };
      mockTimerSubjectLinkService.getLinkageStatus.mockResolvedValue(mockStatus);

      const result = await integratedTimerService.getLinkageStatus();

      expect(mockTimerSubjectLinkService.getLinkageStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });

  describe('Cohérence des données', () => {
    it('devrait appeler les deux services pour ensureDataConsistency', async () => {
      mockCentralizedTimerService.ensureDataConsistency.mockResolvedValue(undefined);
      mockTimerSubjectLinkService.ensureDataConsistency.mockResolvedValue(undefined);

      await integratedTimerService.ensureDataConsistency();

      expect(mockCentralizedTimerService.ensureDataConsistency).toHaveBeenCalled();
      expect(mockTimerSubjectLinkService.ensureDataConsistency).toHaveBeenCalled();
    });

    it('devrait déléguer getTimerSyncInfo au service centralisé', () => {
      const mockSyncInfo = { version: 1, lastModified: Date.now(), hash: 'abc123' };
      mockCentralizedTimerService.getTimerSyncInfo.mockReturnValue(mockSyncInfo);

      const result = integratedTimerService.getTimerSyncInfo('timer-1');

      expect(mockCentralizedTimerService.getTimerSyncInfo).toHaveBeenCalledWith('timer-1');
      expect(result).toEqual(mockSyncInfo);
    });

    it('devrait déléguer getSyncState au service centralisé', () => {
      const mockSyncState = { globalVersion: 1, timerCount: 5, lastCheck: Date.now() };
      mockCentralizedTimerService.getSyncState.mockReturnValue(mockSyncState);

      const result = integratedTimerService.getSyncState();

      expect(mockCentralizedTimerService.getSyncState).toHaveBeenCalled();
      expect(result).toEqual(mockSyncState);
    });

    it('devrait déléguer forceSynchronization au service centralisé', async () => {
      mockCentralizedTimerService.forceSynchronization.mockResolvedValue(undefined);

      await integratedTimerService.forceSynchronization();

      expect(mockCentralizedTimerService.forceSynchronization).toHaveBeenCalled();
    });
  });

  describe('Initialisation', () => {
    it('devrait injecter correctement le service de timers dans le service de liaison', () => {
      // Vérifier que setTimerService a été appelé avec les bonnes méthodes
      expect(mockTimerSubjectLinkService.setTimerService).toHaveBeenCalledWith({
        getTimers: expect.any(Function),
        updateTimer: expect.any(Function),
        removeTimer: expect.any(Function),
        subscribe: expect.any(Function)
      });
    });
  });
});