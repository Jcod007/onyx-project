export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export type TimerMode = 'work' | 'break' | 'longBreak';

export interface TimerConfig {
  workDuration: number; // en secondes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // après combien de sessions work
}

export interface TimerData {
  timeRemaining: number;
  totalTime: number;
  state: TimerState;
  mode: TimerMode;
  sessionCount: number;
}

export type TimerCallback = (data: TimerData) => void;

export class TimerService {
  private timeRemaining: number = 0;
  private totalTime: number = 0;
  private state: TimerState = 'idle';
  private mode: TimerMode = 'work';
  private sessionCount: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private config: TimerConfig;
  
  private onTickCallback?: TimerCallback;
  private onStateChangedCallback?: TimerCallback;
  private onFinishedCallback?: TimerCallback;

  constructor(config: TimerConfig = {
    workDuration: 25 * 60, // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    longBreakInterval: 4 // pause longue toutes les 4 sessions
  }) {
    this.config = config;
    this.reset();
  }

  start(): void {
    if (this.state === 'running') return;
    
    if (this.state === 'idle') {
      this.timeRemaining = this.getCurrentModeDuration();
      this.totalTime = this.timeRemaining;
    }
    
    this.state = 'running';
    this.notifyStateChanged();
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause(): void {
    if (this.state !== 'running') return;
    
    this.state = 'paused';
    this.clearInterval();
    this.notifyStateChanged();
  }

  stop(): void {
    this.state = 'idle';
    this.clearInterval();
    this.reset();
    this.notifyStateChanged();
  }

  reset(): void {
    this.clearInterval();
    this.state = 'idle';
    this.mode = 'work';
    this.timeRemaining = this.getCurrentModeDuration();
    this.totalTime = this.timeRemaining;
    this.notifyStateChanged();
  }

  switchMode(mode: TimerMode): void {
    this.stop();
    this.mode = mode;
    this.timeRemaining = this.getCurrentModeDuration();
    this.totalTime = this.timeRemaining;
    this.notifyStateChanged();
  }

  getTimerData(): TimerData {
    return {
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      state: this.state,
      mode: this.mode,
      sessionCount: this.sessionCount
    };
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getProgress(): number {
    if (this.totalTime === 0) return 0;
    return ((this.totalTime - this.timeRemaining) / this.totalTime) * 100;
  }

  // Callbacks
  onTick(callback: TimerCallback): void {
    this.onTickCallback = callback;
  }

  onStateChanged(callback: TimerCallback): void {
    this.onStateChangedCallback = callback;
  }

  onFinished(callback: TimerCallback): void {
    this.onFinishedCallback = callback;
  }

  private tick(): void {
    if (this.timeRemaining > 0) {
      this.timeRemaining--;
      this.onTickCallback?.(this.getTimerData());
    } else {
      this.handleTimerFinished();
    }
  }

  private handleTimerFinished(): void {
    this.clearInterval();
    this.state = 'finished';
    
    if (this.mode === 'work') {
      this.sessionCount++;
    }
    
    this.onFinishedCallback?.(this.getTimerData());
    this.notifyStateChanged();
    
    // Auto-transition après 3 secondes
    setTimeout(() => {
      this.autoSwitchToNextMode();
    }, 3000);
  }

  private autoSwitchToNextMode(): void {
    if (this.mode === 'work') {
      const isLongBreakTime = this.sessionCount % this.config.longBreakInterval === 0;
      this.switchMode(isLongBreakTime ? 'longBreak' : 'break');
    } else {
      this.switchMode('work');
    }
  }

  private getCurrentModeDuration(): number {
    switch (this.mode) {
      case 'work':
        return this.config.workDuration;
      case 'break':
        return this.config.shortBreakDuration;
      case 'longBreak':
        return this.config.longBreakDuration;
    }
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifyStateChanged(): void {
    this.onStateChangedCallback?.(this.getTimerData());
  }

  destroy(): void {
    this.clearInterval();
  }
}