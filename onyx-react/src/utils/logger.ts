/**
 * Logger utility for conditional logging
 * Replaces console.log with environment-aware logging
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LoggerOptions {
  enabledInProduction: boolean;
  logLevel: LogLevel;
  prefix?: string;
}

class Logger {
  private isDevelopment: boolean;
  private enabledInProduction: boolean;
  private logLevel: LogLevel;
  private prefix: string;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.enabledInProduction = options.enabledInProduction ?? false;
    this.logLevel = options.logLevel ?? 'debug';
    this.prefix = options.prefix ?? '[Onyx]';
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (!this.enabledInProduction) return false;
    
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(message: string, data?: any): [string, ...any[]] {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `${this.prefix} [${timestamp}] ${message}`;
    
    return data !== undefined ? [formattedMessage, data] : [formattedMessage];
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      const args = this.formatMessage(`❌ ${message}`, data);
      console.error(...args);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const args = this.formatMessage(`⚠️ ${message}`, data);
      console.warn(...args);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      const args = this.formatMessage(`ℹ️ ${message}`, data);
      console.info(...args);
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const args = this.formatMessage(`🐛 ${message}`, data);
      console.log(...args);
    }
  }

  // Convenience methods for common patterns
  timer(message: string, data?: any): void {
    this.debug(`⏱️ ${message}`, data);
  }

  calendar(message: string, data?: any): void {
    this.debug(`📅 ${message}`, data);
  }

  link(message: string, data?: any): void {
    this.debug(`🔗 ${message}`, data);
  }

  success(message: string, data?: any): void {
    this.info(`✅ ${message}`, data);
  }

  loading(message: string, data?: any): void {
    this.debug(`🔄 ${message}`, data);
  }
}

// Create logger instances for different modules
export const logger = new Logger();
export const timerLogger = new Logger({ prefix: '[Timer]' });
export const calendarLogger = new Logger({ prefix: '[Calendar]' });
export const linkLogger = new Logger({ prefix: '[Link]' });

// Production logger - only errors and warnings
export const productionLogger = new Logger({
  enabledInProduction: true,
  logLevel: 'warn'
});