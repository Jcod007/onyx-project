import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer, BookOpen, BarChart3, Plus, Clock, Target, TrendingUp } from 'lucide-react';
import { subjectService } from '@/services/subjectService';
import { dailyTimeService } from '@/services/dailyTimeService';
import { Subject } from '@/types/Subject';
import { formatDuration } from '@/utils/timeFormat';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  totalTimeSpent: number;
  totalTargetTime: number;
  overallProgress: number;
}

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    totalTimeSpent: 0,
    totalTargetTime: 0,
    overallProgress: 0
  });
  const [recentSubjects, setRecentSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // 🔄 S'abonner aux changements des services 
    const unsubscribeSubjects = subjectService.subscribe(() => {
      console.log('🔄 [HomePage] Mise à jour sujets détectée, rechargement des données...');
      loadDashboardData();
    });

    const unsubscribeDaily = dailyTimeService.subscribe(() => {
      console.log('🔄 [HomePage] Mise à jour temps quotidien détectée, rechargement des données...');
      loadDashboardData();
    });

    return () => {
      unsubscribeSubjects();
      unsubscribeDaily();
    };
  }, []);

  // 🧹 Fonction de nettoyage des données corrompues
  const cleanCorruptedData = async () => {
    try {
      const subjects = await subjectService.getAllSubjects();
      let hasCorruption = false;
      
      for (const subject of subjects) {
        if (subject.targetTime > 1000000) { // Détection de corruption
          hasCorruption = true;
          console.warn(`🧹 [HomePage] Nettoyage de ${subject.name}: targetTime=${subject.targetTime}`);
          
          // Calculer une valeur raisonnable basée sur weeklyTimeGoal
          let correctedTargetTime = 0;
          if (subject.weeklyTimeGoal) {
            // Convertir l'objectif hebdomadaire en objectif total (ex: 12 semaines = 3 mois)
            correctedTargetTime = subject.weeklyTimeGoal * 12 * 60; // 12 semaines * minutes * 60s
          } else {
            correctedTargetTime = 7200; // 2h par défaut
          }
          
          // Mettre à jour avec la valeur corrigée
          await subjectService.updateSubject(subject.id, {
            targetTime: Math.floor(correctedTargetTime / 60) // Converti en minutes pour l'API
          });
          
          console.log(`✅ [HomePage] ${subject.name} corrigé: ${correctedTargetTime}s`);
        }
      }
      
      if (hasCorruption) {
        console.log('🔄 [HomePage] Rechargement après nettoyage...');
        return true; // Indique qu'un rechargement est nécessaire
      }
    } catch (error) {
      console.error('❌ [HomePage] Erreur nettoyage:', error);
    }
    
    return false;
  };

  const loadDashboardData = async () => {
    try {
      // 🧹 Vérifier et nettoyer les données corrompues
      const needsReload = await cleanCorruptedData();
      if (needsReload) {
        // Rechargement avec données nettoyées
        setTimeout(() => loadDashboardData(), 500);
        return;
      }

      // 🔄 Charger les statistiques cumulatives (vue globale)
      const subjects = await subjectService.getAllSubjects();
      
      // Calculer le temps total cumulé pour chaque matière
      let totalTimeSpent = 0;
      const subjectsWithCumulativeTime = await Promise.all(
        subjects.map(async (subject) => {
          const cumulativeTime = await dailyTimeService.getTotalTimeSpent(subject.id);
          totalTimeSpent += cumulativeTime;
          return { ...subject, cumulativeTimeSpent: cumulativeTime };
        })
      );

      // 🔧 Debug détaillé des valeurs targetTime et weeklyTimeGoal
      console.log('🐛 [HomePage] Debug COMPLET des sujets:', subjects.map(s => ({
        name: s.name,
        targetTime: s.targetTime,
        targetTimeFormatted: formatDuration(s.targetTime, 'planning'),
        targetTimeHours: (s.targetTime / 3600).toFixed(2),
        weeklyTimeGoal: s.weeklyTimeGoal,
        weeklyTimeGoalHours: ((s.weeklyTimeGoal || 0) / 60).toFixed(2),
        status: s.status,
        createdAt: s.createdAt,
        studyDays: s.studyDays
      })));

      const totalTargetTime = subjects.reduce((sum, s) => {
        // 🔧 Validation et nettoyage des données aberrantes
        let validTargetTime = s.targetTime;
        
        // Détecter et corriger les valeurs aberrantes (probablement double conversion)
        if (validTargetTime > 1000000) { // Plus de 277h est suspect
          console.warn(`⚠️ [HomePage] Valeur targetTime aberrante détectée pour ${s.name}: ${validTargetTime}s`);
          // Essayer de corriger en divisant par un facteur commun
          if (validTargetTime > 100000000) { // Très aberrant, probablement en millisecondes
            validTargetTime = Math.floor(validTargetTime / 1000); // ms → s
            console.warn(`🔧 [HomePage] Correction ms→s: ${validTargetTime}s`);
          } else if (validTargetTime > 1000000) { // Aberrant, probablement double conversion
            validTargetTime = Math.floor(validTargetTime / 60); // Annuler une conversion * 60
            console.warn(`🔧 [HomePage] Correction double conversion: ${validTargetTime}s`);
          }
        }
        
        // Validation finale
        if (isNaN(validTargetTime) || validTargetTime < 0) {
          validTargetTime = 0;
        }
        
        console.log(`📊 [HomePage] ${s.name}: targetTime=${s.targetTime}, validé=${validTargetTime}`);
        return sum + validTargetTime;
      }, 0);

      console.log('📊 [HomePage] Total targetTime calculé:', {
        totalTargetTime,
        totalTargetTimeFormatted: formatDuration(totalTargetTime, 'planning'),
        subjectsCount: subjects.length
      });

      // Calculer les statistiques globales
      const stats = {
        total: subjects.length,
        completed: subjects.filter(s => s.status === 'COMPLETED').length,
        inProgress: subjects.filter(s => s.status === 'IN_PROGRESS').length,
        notStarted: subjects.filter(s => s.status === 'NOT_STARTED').length,
        totalTimeSpent, // 🎯 Temps cumulé réel basé sur les sessions
        totalTargetTime,
        overallProgress: 0
      };

      // 🔧 Calcul sécurisé de la progression
      if (stats.totalTargetTime > 0 && stats.totalTimeSpent >= 0) {
        stats.overallProgress = Math.min(100, (stats.totalTimeSpent / stats.totalTargetTime) * 100);
      } else {
        stats.overallProgress = 0;
      }

      // Récents sujets avec temps cumulatif
      const recentlyStudied = subjectsWithCumulativeTime
        .filter(s => s.cumulativeTimeSpent > 0)
        .sort((a, b) => {
          const dateA = a.lastStudyDate ? new Date(a.lastStudyDate).getTime() : 0;
          const dateB = b.lastStudyDate ? new Date(b.lastStudyDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 3);

      console.log('📊 [HomePage] Statistiques cumulatives chargées:', {
        totalTimeSpentHours: Math.round(totalTimeSpent / 3600),
        totalTimeSpentSeconds: totalTimeSpent,
        totalTargetTimeSeconds: totalTargetTime,
        totalTargetTimeHours: Math.round(totalTargetTime / 3600),
        subjectsCount: subjects.length,
        overallProgress: Math.round(stats.overallProgress)
      });

      setStats(stats);
      setRecentSubjects(recentlyStudied);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">
            {t('home.welcome', 'Bienvenue sur Onyx')}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            {t('home.subtitle', "Votre assistant personnel pour gérer efficacement vos sessions d'étude et atteindre vos objectifs académiques.")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/timers"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Timer size={20} />
              {t('timers.createTimer')}
            </Link>
            <Link
              to="/study"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors flex items-center gap-2"
            >
              <BookOpen size={20} />
              {t('home.manageSubjects', 'Gérer les matières')}
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('home.totalSubjects', 'Total matières')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('home.completedSubjects', 'Matières terminées')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('home.totalStudyTime', "Temps total d'étude")}</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatDuration(stats.totalTimeSpent, 'stats')}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('home.overallProgress', 'Progrès global')}</p>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(stats.overallProgress)}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('home.recentActivity', 'Activité récente')}</h2>
            <Link 
              to="/study" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('home.viewAll', 'Voir tout')}
            </Link>
          </div>

          {recentSubjects.length > 0 ? (
            <div className="space-y-4">
              {recentSubjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{subject.name}</h3>
                    <p className="text-sm text-gray-500">
                      {t('home.lastSession', 'Dernière session')}: {subject.lastStudyDate ? new Date(subject.lastStudyDate).toLocaleDateString() : t('home.never', 'Jamais')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration((subject as any).cumulativeTimeSpent || 0, 'stats')} / {formatDuration(subject.targetTime, 'stats')}
                    </p>
                    {/* Barre de progression */}
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1 mb-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, ((subject as any).cumulativeTimeSpent / subject.targetTime) * 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      📊 {t('home.progressSince', 'Progression depuis le')} {new Date(subject.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('home.noRecentActivity', 'Aucune activité récente')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('home.startStudying', 'Commencez à étudier pour voir vos progrès ici')}
              </p>
              <Link
                to="/study"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                {t('subjects.createSubject')}
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('home.quickActions', 'Actions rapides')}</h2>
          
          <div className="space-y-4">
            <Link
              to="/timers"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="p-3 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition-colors">
                <Timer size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{t('home.pomodoroTimer', 'Minuteur Pomodoro')}</h3>
                <p className="text-sm text-gray-500">
                  {t('home.startFocusSession', 'Démarrer une session de travail concentré')}
                </p>
              </div>
            </Link>

            <Link
              to="/study"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="p-3 bg-green-100 rounded-lg mr-4 group-hover:bg-green-200 transition-colors">
                <BookOpen size={24} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{t('home.studySession', "Session d'étude")}</h3>
                <p className="text-sm text-gray-500">
                  {t('home.studySpecificSubject', 'Étudier une matière spécifique')}
                </p>
              </div>
            </Link>

            <Link
              to="/statistics"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="p-3 bg-purple-100 rounded-lg mr-4 group-hover:bg-purple-200 transition-colors">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{t('home.viewStatistics', 'Voir les statistiques')}</h3>
                <p className="text-sm text-gray-500">
                  {t('home.analyzeProgress', "Analyser vos progrès d'étude")}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {stats.totalTargetTime > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('home.overallProgress', 'Progrès global')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('home.generalProgress', 'Progression générale')}</span>
              <span className="font-medium text-gray-900">
                {Math.round(stats.overallProgress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.overallProgress, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatDuration(stats.totalTimeSpent, 'stats')} {t('calendar.studied')}</span>
              <span>
                {/* 🔧 Protection contre les valeurs aberrantes */}
                {stats.totalTargetTime > 1000000 // Plus de ~277h semble aberrant
                  ? "-- --" 
                  : formatDuration(stats.totalTargetTime, 'planning')
                } {t('home.objective', 'objectif')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};