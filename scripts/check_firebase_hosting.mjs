import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto('https://maison-reset.web.app', { waitUntil: 'networkidle', timeout: 90000 })
console.log('URL', page.url())
console.log('TITLE', await page.title())
console.log('BODY', (await page.locator('body').innerText()).slice(0, 3000))
await browser.close()
