import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('PAGEERROR', err.message, err.stack || ''))
page.on('requestfailed', (req) => console.log('REQFAIL', req.url(), req.failure()?.errorText || ''))

await page.goto('https://maison-mikell.netlify.app', { waitUntil: 'networkidle', timeout: 60000 })
await page.screenshot({ path: 'tmp/maison_live_repro.png', fullPage: true })
console.log('TITLE', await page.title())
console.log('BODYLEN', await page.locator('body').innerText().then(t => t.length).catch(() => -1))
await browser.close()
