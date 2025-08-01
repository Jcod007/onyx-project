import React, { useState } from 'react';
import { Subject, TimerConfig } from '../../types';
import { useTimerStore } from '../stores/timerStore';
import { X, Clock, BookOpen } from 'lucide-react';

interface CreateTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
}

const CreateTimerModal: React.FC<CreateTimerModalProps> = ({ isOpen, onClose, subjects }) => {
  const { createTimer } = useTimerStore();
  const [formData, setFormData] = useState({
    hours: 0,
    minutes: 25,
    seconds: 0,
    type: 'STUDY_SESSION' as const,
    linkedSubjectId: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const linkedSubject = formData.linkedSubjectId 
        ? subjects.find(s => s.id === formData.linkedSubjectId)
        : undefined;

      const config: TimerConfig = {
        hours: formData.hours,
        minutes: formData.minutes,
        seconds: formData.seconds,
        type: formData.type,
        linkedSubject
      };

      await createTimer(config);
      onClose();
      
      // Reset form
      setFormData({
        hours: 0,
        minutes: 25,
        seconds: 0,
        type: 'STUDY_SESSION',
        linkedSubjectId: ''
      });
    } catch (error) {
      console.error('Failed to create timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0 }}>Create New Timer</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Clock size={18} />
              Duration
            </label>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Hours</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    hours: parseInt(e.target.value) || 0 
                  }))}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    minutes: parseInt(e.target.value) || 0 
                  }))}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.seconds}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seconds: parseInt(e.target.value) || 0 
                  }))}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, hours: 0, minutes: 25, seconds: 0 }))}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                25m
              </button>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, hours: 0, minutes: 45, seconds: 0 }))}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                45m
              </button>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, hours: 1, minutes: 0, seconds: 0 }))}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                1h
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px' }}>Type</label>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="type"
                  value="STUDY_SESSION"
                  checked={formData.type === 'STUDY_SESSION'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'STUDY_SESSION' 
                  }))}
                />
                <BookOpen size={16} />
                <span>Study Session</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="type"
                  value="FREE_SESSION"
                  checked={formData.type === 'FREE_SESSION'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'FREE_SESSION' 
                  }))}
                />
                <Clock size={16} />
                <span>Free Session</span>
              </label>
            </div>
          </div>

          {formData.type === 'STUDY_SESSION' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BookOpen size={18} />
                Link to Subject (Optional)
              </label>
              
              <select
                value={formData.linkedSubjectId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  linkedSubjectId: e.target.value 
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="">No subject linked</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              
              {subjects.length === 0 && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  No subjects available. Create subjects in the Subjects tab.
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isLoading || (formData.hours === 0 && formData.minutes === 0 && formData.seconds === 0)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {isLoading ? 'Creating...' : 'Create Timer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTimerModal;