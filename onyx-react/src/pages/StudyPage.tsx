import React, { useState, useEffect } from 'react';
import { SubjectCard } from '@/components/SubjectCard';
import { Timer } from '@/components/Timer';
import { Modal } from '@/components/Modal';
import { Subject, CreateSubjectDto, UpdateSubjectDto } from '@/types/Subject';
import { subjectService } from '@/services/subjectService';
import { useReactiveTimers } from '@/hooks/useReactiveTimers';
import { Plus, Search, Filter, BookOpen, X } from 'lucide-react';

interface StudyTimer {
  subject: Subject;
  isActive: boolean;
}

export const StudyPage: React.FC = () => {
  const { ensureDataConsistency } = useReactiveTimers();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [activeTimer, setActiveTimer] = useState<StudyTimer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Subject['status'] | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    targetTime: 60, // en minutes
    defaultTimerDuration: 25 // en minutes
  });
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

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    try {
      const newSubjectData: CreateSubjectDto = {
        name: formData.name.trim(),
        targetTime: formData.targetTime,
        defaultTimerDuration: formData.defaultTimerDuration
      };

      await subjectService.createSubject(newSubjectData);
      
      // Reset form
      setFormData({
        name: '',
        targetTime: 60,
        defaultTimerDuration: 25
      });
      setShowCreateForm(false);
      
      // Reload subjects
      await loadSubjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setFormErrors([errorMessage]);
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
    setFormData({
      name: subject.name,
      targetTime: Math.round(subject.targetTime / 60), // conversion secondes -> minutes
      defaultTimerDuration: Math.round(subject.defaultTimerDuration / 60) // conversion secondes -> minutes
    });
    setFormErrors([]);
    setShowEditForm(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    
    setFormErrors([]);

    try {
      const updateData: UpdateSubjectDto = {
        name: formData.name.trim(),
        targetTime: formData.targetTime,
        defaultTimerDuration: formData.defaultTimerDuration
      };

      await subjectService.updateSubject(editingSubject.id, updateData);
      
      // Reset form
      setFormData({
        name: '',
        targetTime: 60,
        defaultTimerDuration: 25
      });
      setShowEditForm(false);
      setEditingSubject(null);
      
      // Reload subjects
      await loadSubjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setFormErrors([errorMessage]);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${subject.name}" ?`)) {
      try {
        await subjectService.deleteSubject(subject.id);
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
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onStartTimer={handleStartTimer}
              onEdit={handleEditSubject}
              onDelete={handleDeleteSubject}
              showQuickActions={true}
            />
          ))}
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

      {/* Create Subject Form Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Nouvelle matière"
      >
        <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
          {formErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-sm text-red-600 space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la matière *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ex: Mathématiques, Histoire..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objectif de temps (en heures)
            </label>
            <input
              type="number"
              value={formData.targetTime}
              onChange={(e) => setFormData(prev => ({ ...prev, targetTime: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée par défaut du timer (en minutes)
            </label>
            <input
              type="number"
              value={formData.defaultTimerDuration}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultTimerDuration: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="180"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              Créer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Form Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingSubject(null);
          setFormErrors([]);
        }}
        title={`Modifier ${editingSubject?.name}`}
      >
        <form onSubmit={handleUpdateSubject} className="p-6 space-y-4">
          {formErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-sm text-red-600 space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la matière *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ex: Mathématiques, Histoire..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objectif de temps (en heures)
            </label>
            <input
              type="number"
              value={formData.targetTime}
              onChange={(e) => setFormData(prev => ({ ...prev, targetTime: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée par défaut du timer (en minutes)
            </label>
            <input
              type="number"
              value={formData.defaultTimerDuration}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultTimerDuration: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="180"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditForm(false);
                setEditingSubject(null);
                setFormErrors([]);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              Modifier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};