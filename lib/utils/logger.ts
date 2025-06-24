import { createLogger, format, transports } from 'winston';

export interface LogContext {
  userId?: string;
  requestId?: string;
  agentName?: string;
  workflowId?: string;
}

class Logger {
  private winston;

  constructor() {
    this.winston = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        }),
        new transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        new transports.File({ 
          filename: 'logs/combined.log' 
        })
      ],
    });

    // Create logs directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
  }

  info(message: string, context?: LogContext) {
    this.winston.info(message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.winston.error(message, { 
      error: error?.message, 
      stack: error?.stack, 
      ...context 
    });
  }

  warn(message: string, context?: LogContext) {
    this.winston.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.winston.debug(message, context);
  }
}

export const logger = new Logger();