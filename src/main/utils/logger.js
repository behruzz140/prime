import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

class Logger {
  constructor() {
    this.logsDir = path.join(app.getPath('userData'), 'logs');
    
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.logsDir, 'error.log'),
          level: 'error',
          maxsize: 5242880,
          maxFiles: 10
        }),
        new winston.transports.File({
          filename: path.join(this.logsDir, 'combined.log'),
          maxsize: 10485760,
          maxFiles: 5
        }),
        ...(process.env.NODE_ENV === 'development' ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ] : [])
      ]
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

export default new Logger();