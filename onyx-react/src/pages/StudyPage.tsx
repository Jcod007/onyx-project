import React, { useState, useEffect } from 'react';
import { SubjectCard } from '@/components/SubjectCard';
import { Timer } from '@/components/Timer';
import { Modal } from '@/components/Modal';
import { SubjectConfigCard } from '@/components/SubjectConfigCard';
import { Subject, CreateSubjectDto, UpdateSubjectDto } from '@/types/Subject';
import { subjectService } from '@/services/subjectService';
import { useReactiveTimers } from '@/hooks/useReactiveTimers';
import { useTimerContext } from '@/contexts/TimerContext';
import { courseTimerLinkManager } from '@/services/courseTimerLinkManager';
import { Plus, Search, Filter, BookOpen, X } from 'lucide-react';

interface StudyTimer {
  subject: Subject;
  isActive: boolean;
}

export const StudyPage: React.FC = () => {
  const { ensureDataConsistency } = useReactiveTimers();
  const { timers } = useTimerContext();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [activeTimer, setActiveTimer] = useState<StudyTimer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Subject['status'] | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, searchQuery, statusFilter]);

  const loadSubjects = async () => {
    try {
      const loadedSubjects = await subjectService.getAllSubjects();
      setSubjects(loadedSubjects);
      
      // Vérifier la cohérence des données timer-cours après chaque chargement
      await ensureDataConsistency();
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = subjects;

    // Filtrage par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(subject => subject.status === statusFilter);
    }

    setFilteredSubjects(filtered);
  };


  const handleSubjectConfigSave = async (formData: any) => {
    const newSubjectData: CreateSubjectDto = {
      name: formData.name,
      targetTime: Math.round(formData.weeklyTimeMinutes * 60), // Convertir minutes en secondes
      defaultTimerDuration: formData.timerConfig?.simpleTimerDuration 
        ? formData.timerConfig.simpleTimerDuration * 60 
        : 1500, // 25 minutes par défaut
      weeklyTimeGoal: formData.weeklyTimeMinutes,
      studyDays: formData.selectedDays.map((dayId: number) => {
        const dayMap: Record<number, string> = {
          0: 'SUNDAY',
          1: 'MONDAY', 
          2: 'TUESDAY',
          3: 'WEDNESDAY',
          4: 'THURSDAY',
          5: 'FRIDAY',
          6: 'SATURDAY'
        };
        return dayMap[dayId] as any;
      })
    };
    
    try {
      // 1. Créer le cours
      const createdSubject = await subjectService.createSubject(newSubjectData);
      
      // 2. Gérer la configuration du timer
      if (formData.timerConfig?.mode === 'link-existing' && formData.timerConfig?.linkedTimerId) {
        // Lier le timer existant au nouveau cours
        await courseTimerLinkManager.linkCourseToTimer(
          createdSubject.id, 
          formData.timerConfig.linkedTimerId
        );
      } else if (formData.timerConfig?.mode === 'quick-create') {
        // Configurer le timer rapide
        const quickTimerConfig = formData.timerConfig.quickTimerType === 'simple' 
          ? {
              type: 'simple' as const,
              workDuration: formData.timerConfig.simpleTimerDuration || 25
            }
          : {
              type: 'pomodoro' as const,
              workDuration: formData.timerConfig.pomodoroConfig?.workTime || 25,
              shortBreakDuration: formData.timerConfig.pomodoroConfig?.breakTime || 5,
              longBreakDuration: 15,
              cycles: formData.timerConfig.pomodoroConfig?.cycles || 4
            };
            
        await subjectService.updateSubject(createdSubject.id, {
          defaultTimerMode: 'quick_timer',
          quickTimerConfig
        });
      }
      
      setShowCreateForm(false);
      await loadSubjects();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setFormErrors([errorMessage]);
    }
  };

  const handleSubjectConfigUpdate = async (formData: any) => {
    if (!editingSubject) return;
    
    const updateData: UpdateSubjectDto = {
      name: formData.name,
      targetTime: Math.round(formData.weeklyTimeMinutes * 60), // Convertir minutes en secondes
      defaultTimerDuration: formData.timerConfig?.simpleTimerDuration 
        ? formData.timerConfig.simpleTimerDuration * 60 
        : editingSubject.defaultTimerDuration,
      weeklyTimeGoal: formData.weeklyTimeMinutes,
      studyDays: formData.selectedDays.map((dayId: number) => {
        const dayMap: Record<number, string> = {
          0: 'SUNDAY',
          1: 'MONDAY',
          2: 'TUESDAY', 
          3: 'WEDNESDAY',
          4: 'THURSDAY',
          5: 'FRIDAY',
          6: 'SATURDAY'
        };
        return dayMap[dayId] as any;
      })
    };
    
    try {
      // 1. Mettre à jour les informations du cours
      await subjectService.updateSubject(editingSubject.id, updateData);
      
      // 2. Gérer la configuration du timer
      if (formData.timerConfig?.mode === 'link-existing' && formData.timerConfig?.linkedTimerId) {
        // Trouver le timer actuellement lié à ce cours
        const currentLinkedTimer = timers.find(t => t.linkedSubject?.id === editingSubject.id);
        
        // Si on change de timer lié
        if (currentLinkedTimer?.id !== formData.timerConfig.linkedTimerId) {
          // Lier le nouveau timer au cours (cela gérera automatiquement la déliaison de l'ancien)
          await courseTimerLinkManager.linkCourseToTimer(
            editingSubject.id, 
            formData.timerConfig.linkedTimerId
          );
        }
      } else if (formData.timerConfig?.mode === 'quick-create') {
        // Si on passe en mode timer rapide, délier le timer actuel s'il existe
        const currentLinkedTimer = timers.find(t => t.linkedSubject?.id === editingSubject.id);
        if (currentLinkedTimer) {
          await courseTimerLinkManager.unlinkCourse(editingSubject.id);
        }
        
        // Mettre à jour la configuration du timer rapide
        const quickTimerConfig = formData.timerConfig.quickTimerType === 'simple' 
          ? {
              type: 'simple' as const,
              workDuration: formData.timerConfig.simpleTimerDuration || 25
            }
          : {
              type: 'pomodoro' as const,
              workDuration: formData.timerConfig.pomodoroConfig?.workTime || 25,
              shortBreakDuration: formData.timerConfig.pomodoroConfig?.breakTime || 5,
              longBreakDuration: 15,
              cycles: formData.timerConfig.pomodoroConfig?.cycles || 4
            };
            
        await subjectService.updateSubject(editingSubject.id, {
          defaultTimerMode: 'quick_timer',
          quickTimerConfig
        });
      }
      
      setShowEditForm(false);
      setEditingSubject(null);
      await loadSubjects();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleStartTimer = (subject: Subject) => {
    setActiveTimer({
      subject,
      isActive: true
    });
  };

  const handleTimerComplete = async () => {
    if (!activeTimer) return;

    try {
      await subjectService.addStudyTime(
        activeTimer.subject.id,
        activeTimer.subject.defaultTimerDuration
      );
      
      // Recharger les matières pour mettre à jour les progrès
      await loadSubjects();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
    }
  };

  const handleCloseTimer = () => {
    setActiveTimer(null);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setFormErrors([]);
    setShowEditForm(true);
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${subject.name}" ?`)) {
      try {
        // Utiliser courseTimerLinkManager pour gérer la suppression
        // Cela déliera automatiquement le timer associé
        await courseTimerLinkManager.handleCourseDeletion(subject.id);
        await loadSubjects();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Matières</h1>
          <p className="text-gray-600">
            Gérez vos matières d'étude et suivez vos progrès
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nouvelle matière
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une matière..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Subject['status'] | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="NOT_STARTED">Non commencé</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminé</option>
          </select>
        </div>
      </div>

      {/* Active Timer */}
      {activeTimer && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Session d'étude - {activeTimer.subject.name}
              </h3>
              <p className="text-gray-600">Timer en cours</p>
            </div>
            <button
              onClick={handleCloseTimer}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <Timer
            id={activeTimer.subject.id}
            duration={activeTimer.subject.defaultTimerDuration}
            linkedCourse={activeTimer.subject.name}
            config={{
              workDuration: activeTimer.subject.defaultTimerDuration,
              shortBreakDuration: 300,
              longBreakDuration: 900,
              longBreakInterval: 4
            }}
            onSessionComplete={handleTimerComplete}
            showModeButtons={true}
            autoStart={true}
          />
        </div>
      )}

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => {
            // Trouver le timer lié à ce cours
            const linkedTimer = timers.find(timer => 
              timer.linkedSubject && timer.linkedSubject.id === subject.id
            );
            
            return (
              <SubjectCard
                key={subject.id}
                subject={subject}
                linkedTimer={linkedTimer}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
                showQuickActions={true}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'Aucune matière trouvée' 
              : 'Aucune matière créée'
            }
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Créez votre première matière pour commencer à suivre vos progrès d\'étude'
            }
          </p>
          {(!searchQuery && statusFilter === 'ALL') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Créer une matière
            </button>
          )}
        </div>
      )}

      {/* Create Subject Configuration Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title=""
        maxWidth="max-w-lg"
      >
        <SubjectConfigCard
          availableTimers={timers.filter(t => !t.linkedSubject)}
          linkedTimer={null}
          isCreating={true}
          onSave={handleSubjectConfigSave}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>

      {/* Edit Subject Form Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingSubject(null);
          setFormErrors([]);
        }}
        title=""
        maxWidth="max-w-lg"
      >
        <SubjectConfigCard
          subject={editingSubject || undefined}
          availableTimers={timers.filter(t => !t.linkedSubject || t.linkedSubject.id === editingSubject?.id)}
          linkedTimer={editingSubject ? timers.find(t => t.linkedSubject?.id === editingSubject.id) : null}
          isCreating={false}
          onSave={handleSubjectConfigUpdate}
          onCancel={() => {
            setShowEditForm(false);
            setEditingSubject(null);
            setFormErrors([]);
          }}
        />
      </Modal>
    </div>
  );
};