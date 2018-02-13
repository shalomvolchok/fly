export const logger = {
  info(...args) {
    flyLog('info', ...args)
  },
  debug(...args) {
    flyLog('debug', ...args)
  }
}