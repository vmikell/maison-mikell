import { chromium } from 'playwright'

const baseUrl = process.argv[2] || 'https://maison-mikell.netlify.app'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('PAGEERROR', err.message))
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) console.log('NAV', frame.url())
})
page.on('response', async (res) => {
  const url = res.url()
  if (url.includes('/__/auth/') || url.includes('accounts.google.com') || url.includes('identitytoolkit')) {
    console.log('RESP', res.status(), url)
  }
})
page.on('requestfailed', (req) => console.log('REQFAIL', req.url(), req.failure()?.errorText || ''))

await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 })
await page.getByRole('button', { name: /continue with google|sign in or sign up with google/i }).click()
await page.waitForTimeout(8000)
console.log('FINAL_URL', page.url())
console.log('BODY', await page.locator('body').innerText().catch(() => ''))
await browser.close()
