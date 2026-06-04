import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('PAGEERROR', err.message))
page.on('requestfailed', (req) => console.log('REQFAIL', req.url(), req.failure()?.errorText || ''))

await page.goto('https://maison-mikell.netlify.app', { waitUntil: 'networkidle', timeout: 60000 })
await page.getByRole('button', { name: /sign in or sign up with google/i }).click()
await page.waitForTimeout(4000)
console.log('URL', page.url())
console.log('BODY', await page.locator('body').innerText().catch(() => ''))
await browser.close()
