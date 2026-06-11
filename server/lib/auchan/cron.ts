import cron from 'node-cron'
import { runAuchanScraper } from './scraper'

let running = false

export function startAuchanCron(): void {
  // Every night at midnight
  cron.schedule('0 0 * * *', async () => {
    if (running) {
      console.log('[auchan-cron] Previous run still in progress, skipping.')
      return
    }
    running = true
    try {
      await runAuchanScraper()
    } catch (err) {
      console.error('[auchan-cron] Unexpected error:', err)
    } finally {
      running = false
    }
  }, { timezone: 'Europe/Paris' })

  console.log('  ➜  Auchan cron scheduled (every night at 00:00 Europe/Paris)')
}
