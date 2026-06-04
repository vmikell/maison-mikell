import { chromium } from 'playwright'

const browser = await chromium.launchPersistentContext(process.env.HOME + '/.config/google-chrome-for-testing', {
  headless: true,
  channel: 'chromium',
})
const page = await browser.newPage()
page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('PAGEERROR', err.message))
await page.goto('https://console.cloud.google.com/apis/credentials?project=maison-reset', { waitUntil: 'networkidle', timeout: 90000 })
console.log('URL', page.url())
console.log('TITLE', await page.title())
console.log('BODY', (await page.locator('body').innerText()).slice(0, 4000))
await browser.close()
