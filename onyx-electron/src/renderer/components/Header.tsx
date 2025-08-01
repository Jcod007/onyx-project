import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTimerStore } from '../stores/timerStore';
import { Play, Pause, Square, Clock } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const { activeTimer, startTimer, pauseTimer, resetTimer } = useTimerStore();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/timers':
        return 'Timers';
      case '/subjects':
        return 'Study Subjects';
      case '/stats':
        return 'Statistics';
      case '/settings':
        return 'Settings';
      default:
        return 'ONYX';
    }
  };

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    if (!activeTimer) return;
    
    if (activeTimer.isRunning) {
      pauseTimer(activeTimer.id);
    } else {
      startTimer(activeTimer.id);
    }
  };

  const handleResetTimer = () => {
    if (!activeTimer) return;
    resetTimer(activeTimer.id);
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
      </div>

      <div className="header-center">
        {activeTimer && (
          <div className="active-timer-display">
            <div className="timer-info">
              <Clock className="timer-icon" size={16} />
              <span className="timer-time">
                {formatTime(activeTimer.hours, activeTimer.minutes, activeTimer.seconds)}
              </span>
              {activeTimer.linkedSubject && (
                <span className="timer-subject">
                  - {activeTimer.linkedSubject.name}
                </span>
              )}
            </div>
            
            <div className="timer-controls">
              <button
                className={`control-btn ${activeTimer.isRunning ? 'pause' : 'play'}`}
                onClick={handleToggleTimer}
                title={activeTimer.isRunning ? 'Pause Timer' : 'Start Timer'}
              >
                {activeTimer.isRunning ? 
                  <Pause size={14} /> : 
                  <Play size={14} />
                }
              </button>
              
              <button
                className="control-btn reset"
                onClick={handleResetTimer}
                title="Reset Timer"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="window-controls">
          <button 
            className="window-control minimize"
            onClick={() => window.electronAPI?.system.minimize()}
            title="Minimize"
          >
            ─
          </button>
          <button 
            className="window-control maximize"
            onClick={() => window.electronAPI?.system.maximize()}
            title="Maximize"
          >
            □
          </button>
          <button 
            className="window-control close"
            onClick={() => window.electronAPI?.system.close()}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;