import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { 
  RotateCcw, 
  MoreHorizontal,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { subjectService } from '@/services/subjectService';
import { Subject } from '@/types/Subject';
import { formatMinutesToHours } from '@/utils/timeFormat';
import { SmartTimeInput } from '@/components/SmartTimeInput';

interface StudyTimeActionsProps {
  subject: Subject;
  onSuccess?: () => void;
  className?: string;
}

interface TimeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (totalSeconds: number) => void;
  title: string;
}

const TimeInputModal: React.FC<TimeInputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title
}) => {
  const { t } = useTranslation();
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hasInput, setHasInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTimeChange = (h: number, m: number, s: number) => {
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    // Activer le bouton si on a au moins une valeur non nulle
    setHasInput(h > 0 || m > 0 || s > 0);
  };

  const handleConfirm = async () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(totalSeconds);
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      setHasInput(false);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de temps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        <div className="space-y-4">
          <SmartTimeInput
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            onChange={handleTimeChange}
            onRealTimeChange={handleTimeChange}
            placeholder="00:00:00"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !hasInput}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subject: Subject;
}

const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subject
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('studyTime.resetConfirmTitle')}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            {t('studyTime.resetConfirmMessage', { subjectName: subject.name })}
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">
              {t('studyTime.currentProgress')}:
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatMinutesToHours(Math.floor(subject.timeSpent / 60))} / {formatMinutesToHours(Math.floor(subject.targetTime / 60))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            {t('studyTime.resetConfirm')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export const StudyTimeActions: React.FC<StudyTimeActionsProps> = ({
  subject,
  onSuccess,
  className = ""
}) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddManualTime = async (totalSeconds: number) => {
    setIsLoading(true);
    try {
      await subjectService.addManualStudyTime(subject.id, totalSeconds);
      const totalMinutes = Math.floor(totalSeconds / 60);
      console.log(`✅ ${totalMinutes} minutes (${totalSeconds}s) ajoutées manuellement à ${subject.name}`);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur ajout temps manuel:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStudyTime = async () => {
    setIsLoading(true);
    try {
      await subjectService.resetStudyTime(subject.id);
      console.log(`✅ Temps d'étude réinitialisé pour ${subject.name}`);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
        title={t('studyTime.manageStudyTime')}
        disabled={isLoading}
      >
        <MoreHorizontal size={16} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[50]">
          <button
            onClick={() => {
              setShowAddTimeModal(true);
              setShowDropdown(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
          >
            <Plus size={14} className="text-blue-600" />
            {t('studyTime.addManualTime')}
          </button>
          
          <button
            onClick={() => {
              setShowResetModal(true);
              setShowDropdown(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
          >
            <RotateCcw size={14} className="text-red-600" />
            {t('studyTime.resetStudyTime')}
          </button>
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-[10]"
          onClick={() => setShowDropdown(false)}
        />
      )}

      <TimeInputModal
        isOpen={showAddTimeModal}
        onClose={() => setShowAddTimeModal(false)}
        onConfirm={handleAddManualTime}
        title={t('studyTime.addManualTimeTitle', { subjectName: subject.name })}
      />

      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetStudyTime}
        subject={subject}
      />
    </div>
  );
};