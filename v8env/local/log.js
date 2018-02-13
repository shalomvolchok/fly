import { addEventListener } from '../events'

export function setupLocalLogging(ivm) {
  addEventListener('log', (event) => {
    flyLog.apply(null, [event.log.level, ...event.log.args])
  })
}