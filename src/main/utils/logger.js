import winston from 'winston'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const logsDir = path.join(app.getPath('userData'), 'logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const uzTime = () =>
  new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

const logFormat = winston.format.printf(
  ({ level, message, ...meta }) =>
    `${uzTime()} [${level.toUpperCase()}] ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`
)

const appLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'app.log') }),
    new winston.transports.Console()
  ]
})

const sessionLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'session.log') })
  ]
})

const errorLogger = winston.createLogger({
  level: 'error',
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log') }),
    new winston.transports.Console()
  ]
})

class Logger {
  constructor() {
    this.sessionId = `session_${Date.now()}`
    this.sessionStart = new Date()

    appLogger.info('APP_STARTED', { sessionId: this.sessionId })

    sessionLogger.info('SESSION_STARTED', {
      sessionId: this.sessionId,
      time: uzTime()
    })

    app.on('before-quit', () => {
      const duration =
        Math.floor((Date.now() - this.sessionStart.getTime()) / 1000)

      sessionLogger.info('SESSION_ENDED', {
        sessionId: this.sessionId,
        durationSeconds: duration,
        endTime: uzTime()
      })

      appLogger.info('APP_CLOSED', { sessionId: this.sessionId })
    })
  }

  login(userId, username) {
    sessionLogger.info('USER_LOGIN', {
      userId,
      username,
      time: uzTime()
    })
  }

  logout(userId, username) {
    sessionLogger.info('USER_LOGOUT', {
      userId,
      username,
      time: uzTime()
    })
  }

  appError(error) {
    errorLogger.error('APP_ERROR', {
      message: error.message,
      stack: error.stack,
      time: uzTime()
    })
  }

  apiError(url, method, error) {
    errorLogger.error('API_ERROR', {
      url,
      method,
      message: error.message,
      time: uzTime()
    })
  }

  info(message, meta = {}) {
    appLogger.info(message, meta)
  }

  warn(message, meta = {}) {
    appLogger.warn(message, meta)
  }

  error(message, meta = {}) {
    errorLogger.error(message, meta)
  }
}

export default new Logger()
